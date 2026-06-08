# PyTorch 学習ガイド（章別ノートブック）

数学の基礎は学んだが**ほぼ忘れた**人が、手を動かしながら PyTorch を理解するためのガイドです。
必要な数学（微分・勾配・連鎖律・行列積）は、その都度**最小限のミニ復習**を挟みます。

## 対象と前提
- Python は中級（クラス・for・関数が読める）
- NumPy は知っていると有利（知らなくてもOK、都度補足）
- 数学は「厳密な証明」より**イメージ**重視

## 学習の順番（00 → 09）

| # | ファイル | 内容 | 数学リフレッシュ |
|---|---|---|---|
| 00 | （この README） | 使い方・順番・Colab の開き方 | — |
| 01 | `01_tensors.ipynb` | テンソルの基礎（NumPy + GPU + 自動微分の器） | shape・ベクトル/行列 |
| 02 | `02_autograd.ipynb` | 自動微分。`backward()` の正体、勾配降下を手で実装 | 微分=傾き・勾配・連鎖律 |
| 03 | `03_first_model.ipynb` | はじめての学習ループ（線形回帰）。**5ステップの核** | 損失関数・最小化 |
| 04 | `04_nn_module.ipynb` | `nn.Module` でニューラルネット、分類問題 | 活性化・softmax の直感 |
| 05 | `05_data.ipynb` | `Dataset` / `DataLoader` / `transforms` | — |
| 06 | `06_cnn_mnist.ipynb` | 実践：CNN で手書き数字（MNIST）分類 | 畳み込みの直感 |
| 07 | `07_save_transfer_next.ipynb` | 保存・読込・推論・転移学習・次の一歩 | — |
| 08 | `08_cifar10_cnn.ipynb` | 実践②：カラー画像分類（CIFAR-10）＋ データ拡張・過学習対策 | — |
| 09 | `09_transformer_llm.ipynb` | Transformer 入門：注意機構（Attention）と LLM の正体 | attention の式・行列積 |

**最短ルート**：時間がなければ `01 → 02 → 03 → 04 → 06`。05・07 は実務寄り、08・09 は発展（08＝難しい画像、09＝LLM の土台）なので興味に応じて。

## Colab で開く（おすすめ・インストール不要）
1. https://colab.research.google.com を開く
2. 「ファイル」→「ノートブックをアップロード」→ この `.ipynb` を選ぶ
3. 上から `Shift + Enter` で実行
4. GPU を使う章（06・08・09）：メニュー「ランタイム」→「ランタイムのタイプを変更」→ ハードウェアアクセラレータ = **GPU (T4)**

> Colab には PyTorch・torchvision・matplotlib が最初から入っています。`pip install` 不要。

## ローカル（Jupyter）で開く場合
```bash
# 仮想環境を作って（任意）
python -m venv .venv
.venv\Scripts\activate          # Windows
# CPU 版 PyTorch（GPU が無いPCはこれでOK）
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install jupyter matplotlib
jupyter notebook
```
GPU(NVIDIA)があるPCは https://pytorch.org/get-started/locally/ で自分の CUDA に合うコマンドを選んでください。

## 進め方のコツ（重要）
- **`shape` を常に `print` する**：エラーの大半は次元不一致。`print(x.shape)` を口ぐせに。
- **小さく回す**：まずデータ少なめ・epoch 2 で「動く」を確認 → それから本番。
- **写経 → 改造**：数値・層・学習率を変えて挙動の変化を観察。
- 詰まったら公式ドキュメント：https://pytorch.org/docs/stable/ と https://pytorch.org/tutorials/

---
作成：Claude Code 学習ガイド generator
