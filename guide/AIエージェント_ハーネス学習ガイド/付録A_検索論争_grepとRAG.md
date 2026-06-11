# 付録 A ── エージェント検索論争:grep は RAG を置き換えたのか?

> 作成日: 2026-06-11
> 本付録はある問答の議論を整理したもの。フェーズ 4(コンテキストエンジニアリング)とフェーズ 5(ハーネス 9 大構成要素・検索)の補足専題として読む。
> テーマ:**「エージェントの grep が RAG の代わりになった / RAG はもう要らない」という論調は成立するか?**
> ▶ 動くデモ:[附录A_running.py](../AI智能体_Harness学习指南_中文/附录A_running.py)(ZH フォルダ。ベクトル库なしで grep + read の反復= agentic search を実演)

---

## 0. ひとことで言うと

- **コード検索領域**:agentic search(grep + ファイル読みの反復)が **ベクトルDB 型 RAG を事実上置き換えた**。これは意見ではなく Claude Code / Cursor / Devin の**実装事実**。
- **ただし「RAG is dead(RAG は死んだ)」は言い過ぎ**:**非構造テキスト・大規模ナレッジベース・散文への自然言語検索**では RAG が依然として正しいアーキテクチャ。
- **2026 年のコンセンサス**は「どちらか」ではなく:**agentic search を背骨に、意味インデックスは必要な所だけ、加えて context engineering(コンテキスト工学)**。

---

## 1. grep と RAG の本質的な違い

両者とも「テキストから情報を見つける」が、仕組みも得意分野もまったく別物。

| | grep | RAG |
|---|---|---|
| 何をする | **文字列の完全一致 / 正規表現マッチ** | **意味の近さで検索 + LLM が回答生成** |
| 探し方 | 「この文字列が含まれる行」を機械的に走査 | 質問をベクトル化し、ベクトル類似度で「意味的に近い文書」を取得 |
| 出力 | マッチした行そのもの | 取得文書を踏まえた**自然文の回答** |
| 表記ゆらぎ | 表記が違うと当たらない | 言い換え・同義語でも当たる |
| 信頼性 | **速い・確実・100% 再現**。ただし「意味」は理解しない | 意味検索だが**取りこぼし / 取り違え**があり、LLM が幻覚を起こしうる |

### 使い分け

- **「この文字列 / シンボルがどこに**正確に**あるか知りたい」 → grep**(コードレビュー、規約違反の網羅チェックなど漏れが許されない場面)。
- **「内容を理解して質問に答えてほしい / 要約してほしい」 → RAG**(仕様の概要把握、大量ドキュメントへの自然言語質問)。

> 両者は対立物ではなく、実務では**組み合わせる**(RAG で当たりをつけ、grep で正確に詰める)のが強力。

---

## 2. 「grep が RAG を置き換えた」論争は実在する

この議論は 2024〜2025 年にかなり盛り上がった。特に**コーディングエージェント**文脈で「RAG は要らないのでは」という主張が出た。

### 2.1 「grep で十分、RAG 不要」派の論拠

発端:Claude Code 等のエージェントが、ベクトルDB を一切使わず `grep` / `glob` / ファイル読みだけで巨大コードベースを扱えた実体験。

1. **エージェントは人間と同じ探索ができる** ── grep で当たりをつけ、ファイルを読み、また grep する**反復(agentic loop)**で文脈を集める。1ショット検索ではないので、反復がベクトル類似度の取りこぼしを補う。
2. **インデックス維持コストがゼロ** ── RAG はコード変更のたびに埋め込み再計算・再インデックスが必要。grep は常に**最新のソースそのもの**を見るので陳腐化しない。
3. **正確性** ── コードは「意味が近い」より「この識別子が正確にどこにあるか」が重要。grep は完全一致なので嘘がない。
4. **コンテキスト長の爆発的拡大** ── モデルの長コンテキスト化で「関連ファイルを丸ごと入れる」が現実的になり、チャンク分割の必要性が下がった。

### 2.2 「いや RAG は要る」派の反論

1. **grep は語彙(lexical)検索** ── 「認証まわりの処理」のような**意味で探したい**問いに弱い。どの文字列を grep すべきか分からない探索初期で詰む。
2. **コード以外は話が別** ── PDF・仕様書・サポート文書・チャット履歴など**非構造テキスト**は正規表現が効かない。ここは依然 RAG / 意味検索の強み。
3. **スケールとレイテンシ** ── 数百万ファイル、社内ナレッジ全体の規模では「毎回 grep して反復」はトークン・時間ともに高コスト。事前インデックスが効く。
4. **grep もある種の検索拡張生成** ── RAG の定義(外部から取得した情報を LLM に渡して生成)からすると、**agentic grep も広義の RAG の一形態**。消えたのは「ベクトルDB」だけで、Retrieval-Augmented という枠組み自体は生きている。

---

## 3. 決定打:Claude Code がベクトル検索を削除した(2025-05)

論争を「ほぼ決着」へ押しやった鍵となる事実。

- **2025 年 5 月、Anthropic は Claude Code からベクトル検索を削除した**:埋め込みパイプライン・ローカルベクトルDB・チャンク分割ヒューリスティクスを外し、**grep に置き換えた**。
- Claude Code 開発者 **Boris Cherny** 曰く、結果は「**他のあらゆる手法を、大差で上回った(outperformed everything. By a lot)**」。
- **Cursor / Claude Code / Devin** はいずれも `grep` / `find` / 直接ファイル読みに依拠し、ベクトル検索を使わない。

→ 「agentic grep が RAG を置き換えた」は**もはや意見ではなく、主要エージェントの実装事実**。

### 各社が挙げる「捨てた理由」

1. **精度(precision)** ── grep は完全一致。埋め込みは曖昧な偽陽性(fuzzy positives)を出す。
2. **シンプルさ** ── 構築・維持すべきインデックスが存在しない。
3. **鮮度(freshness)** ── 事前ビルドのインデックスは編集中のコードからすぐ乖離。grep は常に最新ソースを見る。
4. **プライバシー** ── 埋め込み計算のためコードを外部へ出さなくて済む。

> Augment の SWE-Bench 事例(Jason Liu)が**「grep が embeddings に勝った」**を具体的に裏付け:エージェントの**しつこさ(persistence)がツールの素朴さを補って余りある**。

---

## 4. ただし「RAG is dead」は誤り ── 各記事の共通の釘刺し

- **RAG は死んでいない。コードという「構造化された世界」で agentic search に置き換わっただけ。**
- **非構造テキスト(PDF / 社内文書 / 散文)・大規模ナレッジベース・自然言語検索**では RAG が依然正しいアーキテクチャ。
- 整理された固定語彙のコードベースなら grep が低コストで十分。だが**エンタープライズの multimodal / 非構造データ**では grep だけだと**「完全に破綻する(fails completely)」**。

---

## 5. トークンコスト分析(本専題の核心)

### 5.1 インデックスの「保存」にトークンは要るか?

2 段階を分けて考える:

| 段階 | トークン消費 |
|---|---|
| **インデックス作成時** | **トークン消費(課金)** ── 文書を埋め込みモデルに通しベクトル化、入力テキスト分が課金。コード / 文書が変わるたびに変更分を再埋め込み |
| **保存しておくだけ** | **トークン不要** ── モデル呼び出しではなく単なるストレージ。代わりにディスク / メモリ(ストレージ代)とベクトルDB 稼働費(サーバー代) |
| **検索(クエリ)時** | 質問を埋め込む分(微量)+ 取得チャンクを LLM に渡し回答生成する分 |

### 5.2 「インデックスのトークン」と「grep のトークン」、どちらが多い?

ポイントは**消費場所の違い**と**単価の桁違い**:

| | RAG(埋め込み) | grep(agentic search) |
|---|---|---|
| いつ消費 | **最初にまとめて**(作成時)+ 変更時に再埋め込み | **毎回の検索のたびに**(読んだファイルがコンテキストに入る) |
| 何のトークン | 埋め込みモデルへの入力 | 生成モデルのコンテキスト(grep 結果 + 読んだファイル本文) |
| 単価 | **非常に安い**(埋め込みは生成の数十分の1) | **高い**(LLM 本体の入力 / 出力トークン) |

**1 回の精密検索あたり** → RAG の方が少ない:
- RAG:質問の埋め込み(数十トークン)+ 上位数チャンクだけ LLM に渡す。**必要な所だけピンポイント**。
- grep:エージェントが grep → ファイル読み → また grep と反復。**関連ファイルを丸ごと何度もコンテキストに読み込む**ので、1 タスクで数万〜数十万入力トークンに膨らむことも。

**累計 / 実運用** → grep が割に合うことが多い:
1. **インデックス作成は一度きりではない** ── コードは頻繁に変わり、そのたび再埋め込み。活発に編集中だとこの再構築が積み上がる。
2. **埋め込みトークンは激安** ── 大量に使っても金額インパクト小。
3. **grep 自体は 0 トークン** ── grep 実行に LLM は不要。賢いエージェントは「読むべきファイルだけ」を絞って読む。

### 5.3 「どっちが多い?」への一番正確な答え

> **トークンの"数"だけなら grep の方が多くなりやすい。だが「安い埋め込みトークン vs 高い LLM トークン」という単価差と、インデックス再構築の手間まで含めて総合すると、コード領域では grep(agentic)の方が割に合う** ── これが現在の実務評価。

そして忘れてはならないのは:**Claude Code が grep を選んだ第一の理由はトークンコストではない**。Boris Cherny が挙げたのは精度・鮮度・保守簡素さ・プライバシーで、**「grep の方が結果が良かった」が本質**。トークンは二次的論点。

---

## 6. 2026 年の落としどころ(実務コンセンサス)

最新記事(2026 年 4〜5 月)の論調:

> **「どちらか」ではなく「agentic を背骨(backbone)に、意味インデックスは必要な所だけ、加えて context engineering」。**

RAGFlow の年末レビューが象徴的 ── トレンド自体が RAG から **"From RAG to Context"**(RAG から「コンテキスト工学」へ)という枠組みの拡張へ移った。

### 本プロジェクト(ハーネス学習)との関連

- 旧 ASP コード・参照実装の探索 → **grep + ファイル読みの反復が正攻法**。
- 規約違反の網羅チェック(絶対禁止トップ10)のように**1件も漏らせない**用途 → **grep 型が必須**。
- 棚卸し.md・旧仕様の「意味的な概要把握」探索フェーズ → 意味検索の発想がまだ役立つ。

→ 本プロジェクトの「コード探索は grep 正攻法・規約チェックは grep 必須」という方針は、**最新の業界動向と完全に整合**。学習ガイドに対応づけると、これは**フェーズ 4(コンテキストエンジニアリング)の「検索 = コンテキスト注入」**と**フェーズ 5(ハーネス 9 大構成要素)の検索コンポーネント**の生きた教材。

---

## 7. 参考文献(出典)

- Why Cursor, Claude Code, and Devin Use grep, Not Vectors — MindStudio
  https://www.mindstudio.ai/blog/is-rag-dead-what-ai-agents-use-instead
- Coding Agents Skipped RAG — RAG Still Wins on Large Docs — MindStudio
  https://www.mindstudio.ai/blog/is-rag-dead-what-ai-coding-agents-use-instead
- Settling the RAG Debate: Why Claude Code Dropped Vector DB-Based RAG — SmartScope
  https://smartscope.blog/en/ai-development/practices/rag-debate-agentic-search-code-exploration/
- Why Claude Code Abandoned RAG for Agentic Search — Zenn (karamage)
  https://zenn.dev/karamage/articles/2514cf04e0d1ac?locale=en
- Claude Code Doesn't Index Your Codebase. Here's What It Does Instead. — Vadim's blog
  https://vadim.blog/claude-code-no-indexing/
- Why Grep Beat Embeddings in Our SWE-Bench Agent (Augment) — Jason Liu
  https://jxnl.co/writing/2025/09/11/why-grep-beat-embeddings-in-our-swe-bench-agent-lessons-from-augment/
- Developers Debate Whether RAG is Dead — BigGo News
  https://biggo.com/news/202510020722_RAG_vs_AI_Agents_Debate
- From RAG to Context — A 2025 year-end review of RAG — RAGFlow
  https://ragflow.io/blog/rag-review-2025-from-rag-to-context
- AI Agents Don't Need Vector Search Anymore: The Agentic Search Stack Replacing RAG in 2026 — Medium (Abdullah Grewal)
  https://buzzgrewal.medium.com/ai-agents-dont-need-vector-search-anymore-inside-the-agentic-search-stack-replacing-rag-in-2026-58efcabe4f6f
- Is RAG Dead? Long Context, Grep, and the End of the Mandatory Vector DB — AkitaOnRails
  https://akitaonrails.com/en/2026/04/06/rag-is-dead-long-context/
