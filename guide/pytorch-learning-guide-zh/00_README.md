# PyTorch 学习指南（分章节笔记本）

面向**有数学基础但大多忘记了**的人，边动手边理解 PyTorch。
需要用到的数学（求导・梯度・链式法则・矩阵乘法）会在用到时穿插**最小限度的复习**。

## 对象与前提
- Python 中级（能读懂类・for・函数）
- 了解 NumPy 更好（不了解也行，会随时补充）
- 数学重**直觉**而非"严格证明"

## 学习顺序（00 → 09）

| # | 文件 | 内容 | 数学复习 |
|---|---|---|---|
| 00 | （本 README） | 使用方法・顺序・Colab 打开方式 | — |
| 01 | `01_tensors.ipynb` | 张量基础（NumPy + GPU + 自动微分的容器） | shape・向量/矩阵 |
| 02 | `02_autograd.ipynb` | 自动微分。`backward()` 的真相，手写梯度下降 | 求导=斜率・梯度・链式法则 |
| 03 | `03_first_model.ipynb` | 第一个训练循环（线性回归）。**五步核心** | 损失函数・最小化 |
| 04 | `04_nn_module.ipynb` | 用 `nn.Module` 搭神经网络，分类问题 | 激活・softmax 直觉 |
| 05 | `05_data.ipynb` | `Dataset` / `DataLoader` / `transforms` | — |
| 06 | `06_cnn_mnist.ipynb` | 实战：用 CNN 识别手写数字（MNIST） | 卷积的直觉 |
| 07 | `07_save_transfer_next.ipynb` | 保存・加载・推理・迁移学习・下一步 | — |
| 08 | `08_cifar10_cnn.ipynb` | 实战②：彩色图像分类（CIFAR-10）+ 数据增强・防过拟合 | — |
| 09 | `09_transformer_llm.ipynb` | Transformer 入门：注意力机制与 LLM 的本质 | attention 公式・矩阵乘法 |

**最短路线**：时间紧就 `01 → 02 → 03 → 04 → 06`。05・07 偏实用，08・09 是进阶（08＝较难的图像，09＝LLM 的基础），按兴趣选。

## 在 Colab 打开（推荐・免安装）
1. 打开 https://colab.research.google.com
2. 「文件」→「上传笔记本」→ 选择这个 `.ipynb`
3. 从上到下 `Shift + Enter` 运行
4. 需要 GPU 的章节（06・08・09）：菜单「代码执行程序(Runtime)」→「更改运行时类型」→ 硬件加速器 = **GPU (T4)**

> Colab 已预装 PyTorch・torchvision・matplotlib，无需 `pip install`。

## 在本地（Jupyter）打开
```bash
# 建虚拟环境（可选）
python -m venv .venv
.venv\Scripts\activate          # Windows
# CPU 版 PyTorch（没有 GPU 的电脑用这个即可）
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install jupyter matplotlib
jupyter notebook
```
有 NVIDIA GPU 的电脑请到 https://pytorch.org/get-started/locally/ 选择匹配你 CUDA 的命令。

## 学习要诀（重要）
- **随时 `print` 出 `shape`**：报错大多是维度不一致。把 `print(x.shape)` 变成口头禅。
- **从小处跑起**：先用少量数据・epoch 2 确认"能跑通"，再上正式规模。
- **抄写 → 改造**：改数值・层・学习率，观察行为变化。
- 卡住就查官方文档：https://pytorch.org/docs/stable/ 和 https://pytorch.org/tutorials/

---
制作：Claude Code 学习指南 generator
