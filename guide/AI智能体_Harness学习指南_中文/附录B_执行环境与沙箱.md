# 附录 B ── 智能体的执行环境与沙箱(什么时候才需要 Docker)

> 创建日期: 2026-06-12
> 阶段 5(Harness 九大组件中的「Sandbox / Execution Engine」)与阶段 7(安全·护栏)的补充专题。
> 主题:**「运行一个智能体,需要 Docker 这类隔离环境吗?」**

---

## 0. 一句话

- **需不需要,取决于「工具做什么」**。只读(read/list/grep)就不需要隔离;**执行任意代码/命令**就必须隔离。
- **即使没有隔离,先用「路径/命令护栏」就能挡掉大部分事故**(阶段 7)。Docker 是在此之上更强的隔离。
- 本指南的运行 demo(`02/04/附录A_running.py`)**不需要 Docker**。但已加入**路径限制护栏**,防止读到 `.env`(HF_TOKEN)。

---

## 1. 什么是「执行环境」

智能体在模型说「我要调用某工具」时,**由 Harness 真正去执行它**(阶段 2)。这个「执行发生的地方」就是执行环境。

- 工具只有 `read_file` → 执行就是「打开一个文件读一下」。**在你的电脑上直接做也安全**。
- 工具里有 `run_bash(command)` → 模型给出的**任意命令会在你的电脑上运行**。`rm -rf` 这种破坏性命令、或往外发送数据都可能发生。**这时就需要隔离**。

也就是说,「要不要隔离执行环境」=**「允许把模型指示的操作,在多大程度上放到真实环境里执行」**。

---

## 2. Docker 是什么(写给完全不了解的人)

**Docker = 把应用关进一个「小盒子(容器)」里运行的工具。**

打个比方:
- 你的电脑 = 你的家
- Docker 容器 = 家里搭起的一个**临时小房间**。在里面无论做什么,**都碰不到房间外(你真正的文件和配置)**。
- 房间里**只有你放进去的工具**。实验做完,**整个房间扔掉**(`docker rm`)。

技术上:
- **镜像(image)**= 小房间的「设计图」(OS + 所需软件打包而成),写在 `Dockerfile` 里。
- **容器(container)**= 由设计图启动的**真实小房间**,可同时开很多个。
- **隔离**= 容器内的进程,默认看不到宿主机(你的电脑)的文件、网络、其他容器;只放行你允许的。

> 对智能体的好处:**就算模型失控执行了 `rm -rf /`,删掉的也只是小房间里的东西,你真正的文件安然无恙**;再把网络关掉,就连数据外泄也防住。能一瞬间造出一个「用完即弃的安全实验场」,正是 Docker。

(除 Docker 外,还有轻量 VM、gVisor、Firecracker、各家云端 sandbox 服务等;但最普及、最易上手的是 Docker。)

---

## 3. 「要不要隔离」判断表

| 工具的性质 | 执行环境 | 例子 |
|---|---|---|
| 只读(read / list / grep) | **宿主机直接跑** + 轻量路径限制 | 本指南的 demo |
| 受限写入(只写固定的笔记文件) | 宿主机直接跑 | `write_note` |
| 大范围写/删文件、装包、访问外网 | **建议沙箱** | 文件整理智能体 |
| **执行任意代码 / 命令、运行模型生成的代码** | **必须用 Docker 等隔离** | 编码智能体、`run_bash`、`eval` |
| 生产 / 不特定多数 / 不可信输入 | **必须隔离**(容器 + 最小权限 + 断网 + 资源上限) | 公开服务 |

> 记法:**「要不要把模型写的代码/命令在『真实环境』里跑?」是分水岭**。要跑,就隔离。

---

## 4. 没有 Docker 也先有效:护栏(阶段 7)

在隔离之前,**用便宜的护栏就能挡掉大多数事故**。本指南 demo 里就有的「路径限制」即是:

```python
def _within_work(path):
    """只允许 WORK 内的路径。防止读到 .env(HF_TOKEN)或越权到父目录。"""
    full = os.path.realpath(path)
    root = os.path.realpath(WORK)
    return full == root or full.startswith(root + os.sep)

def t_read_file(args):
    if not _within_work(args["path"]):
        return "⛔ 拒绝: 超出允许范围(.env 等读不到)"   # ← 拒绝作为「观察」返回
    ...
```

要点:
- **拒绝不要抛异常崩溃,而作为观察(tool 结果)返回** → 模型会「被拒了就换个办法」(阶段 7 的模式)。
- 危险命令检测(`rm -rf`、`DROP TABLE` 等)、审批门(删除前向人确认)也是同一思路(见阶段 7-2)。

→ **只读类智能体,用「无 Docker + 护栏」就足够安全**。

---

## 5. 要加代码执行的那天:用 Docker 做最小隔离

假设要做「执行模型写的 Python」的工具。**在宿主机上 `exec()` 绝对不行**(任意代码执行=最危险)。把它关进 Docker:

思路(伪代码):

```python
import subprocess, tempfile, os

def run_python_in_docker(code: str) -> str:
    """把模型写的 code,只在一个用完即弃的 Docker 容器里执行。"""
    with tempfile.TemporaryDirectory() as d:
        with open(os.path.join(d, "snippet.py"), "w", encoding="utf-8") as f:
            f.write(code)
        result = subprocess.run(
            [
                "docker", "run", "--rm",        # --rm: 结束后丢弃容器
                "--network", "none",            # 断网(防止外发)
                "--memory", "256m",             # 内存上限(防失控)
                "--cpus", "1",                  # CPU 上限
                "-v", f"{d}:/work:ro",          # 代码以只读挂载
                "python:3.12-slim",             # 使用的镜像(设计图)
                "python", "/work/snippet.py",
            ],
            capture_output=True, text=True, timeout=15,
        )
        return (result.stdout + result.stderr)[:2000]
```

这里起作用的隔离:
- `--rm` … 执行后连容器一起销毁(用完即弃的小房间)
- `--network none` … 无法对外通信(防止令牌/数据被带走)
- `--memory` / `--cpus` / `timeout` … 失控、死循环的资源上限
- `-v ...:ro` … 传入的文件**只读**,看不到宿主机其他地方

> 这就是「阶段 5 的 Sandbox 基础设施」的具体形态,也是智能体**安全地试跑自己写的代码、看结果再改**(self-verification)的地基。

(注:跑这个例子需要电脑装了 Docker。本指南的 demo 没有代码执行,所以不装 Docker 也行。)

---

## 6. 小结

| 问题 | 答案 |
|---|---|
| 智能体必须用 Docker 吗? | **不。看工具而定。** |
| 本指南的 demo 呢? | **不需要** Docker(只读类)。已加路径限制护栏 |
| 什么时候要 Docker? | 加了**执行任意代码/命令**的工具时(必须);生产·不可信输入(必须) |
| Docker 到底是什么? | 把应用关进用完即弃、隔离的「小房间」运行的工具;失控也伤不到真实环境 |
| 除了 Docker? | 先上**护栏**(路径限制·危险命令检测·审批门);确需隔离再用 Docker / 云沙箱 |

→ 分阶段:**①护栏 → ②(若加代码执行)Docker 隔离 → ③生产再加最小权限+断网+资源上限**。

---

## 7. 参考(本指南内相关处)

- 阶段 5 ── Harness 基础设施「Sandbox(隔离执行生成代码)」「Execution Engine」
- 阶段 7 ── 安全的多层防御(危险命令检测·审批门·范围限制)
- 运行 demo ── `04_running.py` / `附录A_running.py` 里的 `_within_work`(路径限制护栏的实现示例)

---

## 8. 进一步学习 Docker(从零的学习路径)

到「能用作智能体沙箱」为止,最短的 4 步。

### Step 1:装好,先跑一个「盒子」(约 30 分钟)
- 安装 **Docker Desktop**(Windows/Mac 有 GUI,很简单;Windows 需要 WSL2)。
- 第一感受:
  ```bash
  docker run hello-world                    # 验证可用
  docker run -it python:3.12-slim python    # 一瞬间起一个 Python「小房间」
  ```
  → `exit()` 退出后房间就消失。亲身理解「用完即弃的隔离环境」。

### Step 2:只先掌握 3 个核心概念
| 术语 | 一句话 |
|---|---|
| **image(镜像)** | 小房间的设计图(如 `python:3.12-slim`) |
| **container(容器)** | 由设计图启动的真实房间 |
| **Dockerfile** | 写自己设计图的「菜谱」 |

练手:`docker ps`(在跑的房间)/ `docker images`(设计图清单)/ `docker rm`、`docker rmi`(清理)。

### Step 3:动手玩对智能体有用的「隔离选项」
逐个试 §5 最小例用到的参数:
```bash
docker run --rm --network none --memory 256m --cpus 1 \
  -v "$PWD":/work:ro python:3.12-slim python /work/snippet.py
```
`--rm`(用完即弃)/ `--network none`(断网)/ `--memory`、`--cpus`(上限)/ `-v ...:ro`(只读)。
→ 这就是「安全隔离代码执行工具」的核心。到这一步,§5 的 `run_python_in_docker` 你就能自己跑起来。

### Step 4:写自己的设计图(Dockerfile)
```dockerfile
FROM python:3.12-slim
RUN pip install requests
WORKDIR /work
```
`docker build -t my-sandbox .` → `docker run --rm my-sandbox ...`

### 推荐教材
- 官方 Get Started(最稳):https://docs.docker.com/get-started/
- Play with Docker(浏览器即试,无需安装):https://labs.play-with-docker.com/
- 最短概念理解:官方「What is a container?」

### 学习顺序的诀窍
- **智能体用途暂时不需要 Compose 或 Kubernetes**。先把「用 `docker run` 把单个容器用完即弃」掌握就够(本附录的 sandbox 就是这个)。
- 掌握 network / volume / Dockerfile 三件后,实际跑一下 §5 的 `run_python_in_docker`,亲身体验「代码执行智能体的隔离」→ 立刻豁然开朗。
