<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
  - Template principle slot 1 -> I. Step-Isolated Multi-Agent Workflow / 步骤隔离的多智能体工作流 / ステップ分離マルチエージェントワークフロー
  - Template principle slot 2 -> II. Structured Inter-Agent Communication / 结构化智能体通信 / 構造化エージェント間通信
  - Template principle slot 3 -> III. Review-Agent Quality Gates / 审核智能体质量门禁 / レビューエージェント品質ゲート
  - Template principle slot 4 -> IV. Role-Fit Hugging Face Model Selection / 按职责匹配的 Hugging Face 模型选型 / 役割適合型 Hugging Face モデル選定
  - Template principle slot 5 -> V. Trilingual Delivery and Simple Code Style / 三语交付与简洁代码风格 / 3言語成果物と簡潔なコード規約
- Added sections:
  - Architecture & Delivery Constraints / 架构与交付约束 / アーキテクチャと提供制約
  - Workflow & Quality Gates / 工作流与质量门禁 / ワークフローと品質ゲート
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ updated - .specify/templates/plan-template.md
  - ✅ updated - .specify/templates/spec-template.md
  - ✅ updated - .specify/templates/tasks-template.md
  - ✅ updated - .specify/templates/agent-file-template.md
  - ✅ updated - .specify/templates/checklist-template.md
  - ⚠ pending - .specify/templates/commands/ (directory missing; no command templates to sync)
- Follow-up TODOs:
  - None
-->
# Spec-Kit Inspired Multi-Agent Platform Constitution

## Core Principles

### I. Step-Isolated Multi-Agent Workflow / 步骤隔离的多智能体工作流 / ステップ分離マルチエージェントワークフロー
- **ZH**: `specify`、`clarify`、`plan`、`tasks`、`implement`、`analyze` 等每个 spec-kit 阶段 MUST 由独立 agent 负责；每个 agent MUST 只消费已批准输入并产出明确文件，不得跳过阶段、混合职责或直接覆盖其他阶段的核心产物。
- **JA**: `specify`、`clarify`、`plan`、`tasks`、`implement`、`analyze` などの各段階は、必ず独立したエージェントが担当する。各エージェントは承認済み入力のみを受け取り、明確な成果物を出力しなければならず、段階のスキップ、責務の混在、他段階成果物の直接上書きをしてはならない。
- **EN**: Every spec-kit stage, including `specify`, `clarify`, `plan`, `tasks`, `implement`, and `analyze`, MUST be owned by a dedicated agent. Each agent MUST consume approved inputs only and emit explicit artifacts; stage skipping, blended ownership, and direct overwrites of another stage's primary output are prohibited.
- **Rationale**: Step isolation keeps the workflow auditable, replaceable, and easy to evolve as the platform grows.

### II. Structured Inter-Agent Communication / 结构化智能体通信 / 構造化エージェント間通信
- **ZH**: agent 之间 MUST 通过版本化文档、结构化 JSON 载荷、共享上下文摘要和明确的 handoff 元数据通信；每次交接 MUST 记录来源、目标、模型、输入摘要、输出路径和状态。
- **JA**: エージェント間通信は、版管理された文書、構造化 JSON ペイロード、共有コンテキスト要約、明示的な handoff メタデータを用いて行わなければならない。各引き継ぎでは、送信元、送信先、モデル、入力要約、出力パス、状態を記録すること。
- **EN**: Agents MUST communicate through versioned documents, structured JSON payloads, shared context summaries, and explicit handoff metadata. Every transfer MUST record source, destination, model, input summary, output path, and status.
- **Rationale**: Structured handoffs are required for cross-agent continuity, debugging, replay, and safe model substitution.

### III. Review-Agent Quality Gates / 审核智能体质量门禁 / レビューエージェント品質ゲート
- **ZH**: 必须设置独立 review agent，在 `spec`、`plan`、`tasks`、重要实现产物以及发布前检查等关键节点执行审核。review agent MAY 直接修改重要文件，但每次修改 MUST 附带原因、差异说明和是否阻塞下游阶段的结论。
- **JA**: 独立した review agent を必ず設け、`spec`、`plan`、`tasks`、重要な実装成果物、リリース前検査などの重要ノードでレビューを実施すること。review agent は重要ファイルを直接修正してよいが、そのたびに理由、差分説明、次段階をブロックするかどうかを記録しなければならない。
- **EN**: A dedicated review agent is mandatory at the `spec`, `plan`, `tasks`, major implementation-artifact, and pre-release checkpoints. The review agent MAY edit important files directly, but each intervention MUST include rationale, change notes, and a blocking or non-blocking decision for downstream stages.
- **Rationale**: A formal review gate catches cross-stage defects early and keeps important artifacts trustworthy.

### IV. Role-Fit Hugging Face Model Selection / 按职责匹配的 Hugging Face 模型选型 / 役割適合型 Hugging Face モデル選定
- **ZH**: 所有 agent 使用的模型 MUST 选自 Hugging Face 上公开可获取的模型。每个 agent MUST 记录所选模型、职责匹配原因、已知局限、降级策略和替换条件；选型 MUST 依据该模型在推理、编码、总结、审校或翻译方面的相对优势，而不是统一使用单一模型。
- **JA**: すべてのエージェントモデルは Hugging Face 上で公開利用可能なモデルから選定しなければならない。各エージェントは、採用モデル、役割適合の理由、既知の制約、フォールバック方針、置換条件を記録すること。選定は推論、実装、要約、査読、翻訳などの相対的な得意分野に基づき、単一モデルへの固定を避けること。
- **EN**: All agent models MUST be selected from publicly available Hugging Face models. Each agent MUST document its chosen model, role-fit rationale, known limitations, fallback plan, and replacement triggers. Selection MUST follow the model's comparative strengths in reasoning, coding, summarization, review, or translation instead of forcing a single model on every role.
- **Rationale**: Role-fit model assignment improves quality, cost control, and resilience.

### V. Trilingual Delivery and Simple Code Style / 三语交付与简洁代码风格 / 3言語成果物と簡潔なコード規約
- **ZH**: 面向用户或团队协作的重要文档 MUST 同时提供中文、日文、英文版本，并保持结构对齐。代码 MUST 追求简单实现、低认知负担和统一命名：Python 使用 `snake_case` 函数/变量、`PascalCase` 类、`UPPER_SNAKE_CASE` 常量；数据库表与字段使用 `snake_case`；路由和前端路径使用 `kebab-case` 或团队约定的统一规则。
- **JA**: ユーザー向けまたはチーム協業に関わる重要文書は、中国語、日本語、英語の 3 言語版を必ず提供し、構造を揃えること。コードは単純で理解しやすく、一貫した命名を採用する。Python は関数・変数に `snake_case`、クラスに `PascalCase`、定数に `UPPER_SNAKE_CASE` を用い、DB テーブル/カラムは `snake_case`、ルートや画面パスは `kebab-case` またはチーム合意の統一規則を用いること。
- **EN**: Important user-facing and collaboration-facing documents MUST be delivered in Chinese, Japanese, and English with aligned structure. Code MUST favor simple implementation, low cognitive load, and uniform naming: Python uses `snake_case` for functions and variables, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants; database tables and columns use `snake_case`; routes and frontend paths use `kebab-case` or another team-wide convention documented once and reused everywhere.
- **Rationale**: Trilingual clarity expands usability, while simple and uniform code keeps the multi-agent system maintainable.

## Architecture & Delivery Constraints / 架构与交付约束 / アーキテクチャと提供制約

- **ZH**: 用户输入入口 MUST 是图形化界面或网页端；CLI 可以作为辅助工具，但不得成为主交互面。
- **JA**: ユーザー入力の主要入口は GUI または Web フロントエンドでなければならない。CLI は補助用途に限る。
- **EN**: The primary user entry point MUST be a GUI or web frontend; CLI support is optional and secondary.

- **ZH**: 后端编排、业务逻辑、agent 运行时和审核流程 SHOULD 统一使用 Python 实现，除非计划文档记录了更简单且更有利的例外理由。
- **JA**: バックエンドのオーケストレーション、業務ロジック、エージェント実行基盤、レビューフローは、より単純で妥当な例外が計画書に明記されない限り、Python を基本とする。
- **EN**: Backend orchestration, business logic, agent runtime, and review flow SHOULD be implemented in Python unless a simpler and better-documented exception is approved in the plan.

- **ZH**: 持久化数据库 MUST 使用 MySQL，至少存储工作流会话、artifact 元数据、review 记录、消息索引、模型分配和审计日志。
- **JA**: 永続化データベースは MySQL を必須とし、少なくともワークフローセッション、成果物メタデータ、レビュー記録、メッセージ索引、モデル割当、監査ログを保存すること。
- **EN**: MySQL is the mandatory persistence layer and MUST store workflow sessions, artifact metadata, review records, message indexes, model assignments, and audit logs.

- **ZH**: 重要文件 MUST 采用 UTF-8 编码，并在文档层保持中日英三语段落的可追踪映射。
- **JA**: 重要ファイルは UTF-8 を用い、文書層で中国語・日本語・英語の対応関係を追跡可能にすること。
- **EN**: Important files MUST use UTF-8 and preserve traceable Chinese, Japanese, and English section alignment at the document layer.

## Workflow & Quality Gates / 工作流与质量门禁 / ワークフローと品質ゲート

1. **ZH**: 每个功能在 `spec` 阶段 MUST 明确 agent roster、阶段输入输出、review 节点、前端交互方式、MySQL 持久化范围和三语文档范围。  
   **JA**: 各機能の `spec` では、agent roster、段階ごとの入出力、review ノード、フロントエンド操作方式、MySQL 永続化範囲、3 言語文書範囲を必ず明記する。  
   **EN**: Every feature `spec` MUST define the agent roster, stage inputs and outputs, review checkpoints, frontend interaction mode, MySQL persistence scope, and trilingual document scope.

2. **ZH**: `plan` MUST 包含 Constitution Check，并验证是否满足独立 agent、审核 agent、结构化通信、Hugging Face 模型映射、Python/MySQL/Web、三语文档和统一命名。  
   **JA**: `plan` には Constitution Check を含め、独立 agent、review agent、構造化通信、Hugging Face モデル割当、Python/MySQL/Web、3 言語文書、統一命名の順守を検証する。  
   **EN**: The `plan` MUST include a Constitution Check covering independent agents, review-agent gates, structured communication, Hugging Face model mapping, Python/MySQL/Web constraints, trilingual documentation, and uniform naming.

3. **ZH**: `tasks` MUST 显式包含 review gate、agent 通信契约、MySQL 变更、前后端协同、三语文档、命名与风格校验等任务；缺失时视为计划不完整。  
   **JA**: `tasks` には、review gate、agent 通信契約、MySQL 変更、フロント/バック協調、3 言語文書、命名/スタイル検証のタスクを明示的に含めること。欠落時は計画不備とみなす。  
   **EN**: `tasks` MUST explicitly include review gates, agent communication contracts, MySQL changes, frontend/backend integration, trilingual documentation, and naming/style verification tasks; omission means the plan is incomplete.

4. **ZH**: 关键阶段在 review agent 通过前 MUST NOT 进入下游实施；人工覆盖 ONLY 在记录原因、风险和后续修正计划后允许。  
   **JA**: 重要段階は review agent の承認前に下流へ進めてはならない。人手による例外承認は、理由、リスク、是正計画を記録した場合にのみ許可される。  
   **EN**: Critical stages MUST NOT proceed downstream before review-agent approval. Human override is allowed ONLY when rationale, risk, and a remediation plan are recorded.

5. **ZH**: 所有交付在合并前 MUST 通过至少一次端到端工作流验证，确认 GUI/Web 输入、agent 串联、review gate、MySQL 持久化和三语输出均可运行。  
   **JA**: すべての成果物は統合前に少なくとも 1 回の end-to-end ワークフロー検証を通過し、GUI/Web 入力、agent 連携、review gate、MySQL 永続化、3 言語出力が動作することを確認しなければならない。  
   **EN**: Before merge, every deliverable MUST pass at least one end-to-end workflow validation proving GUI/Web input, agent chaining, review gates, MySQL persistence, and trilingual output all function together.

## Governance

- **ZH**: 本宪章高于仓库中的其他流程说明。任何架构、模型来源、数据库、界面入口或文档语言的例外，MUST 在 `plan` 中记录并经 review agent 与负责人共同批准。
- **JA**: 本憲章はリポジトリ内の他の運用指針に優先する。アーキテクチャ、モデル出所、DB、入力画面、文書言語に関する例外は、必ず `plan` に記録し、review agent と責任者の承認を受けること。
- **EN**: This constitution supersedes other repository process guidance. Any exception to architecture, model source, database, entry interface, or document language MUST be recorded in the `plan` and approved by both the review agent and the responsible owner.

- **ZH**: 修订流程 MUST 包含：变更动机、受影响原则、模板同步状态、迁移影响和版本号调整说明。
- **JA**: 改定手続きには、変更理由、影響を受ける原則、テンプレート同期状況、移行影響、バージョン変更理由を必ず含めること。
- **EN**: Amendments MUST include the motivation, impacted principles, template sync status, migration impact, and version-bump rationale.

- **ZH**: 版本号遵循语义化规则：删除或重定义原则使用 MAJOR；新增原则、强制关卡或重大约束使用 MINOR；仅澄清文案使用 PATCH。
- **JA**: バージョンはセマンティックバージョニングに従う。原則の削除や再定義は MAJOR、新原則・必須ゲート・重要制約の追加は MINOR、文言の明確化のみは PATCH とする。
- **EN**: Versioning follows semantic rules: principle removal or redefinition is MAJOR; new principles, mandatory gates, or material constraints are MINOR; wording-only clarifications are PATCH.

- **ZH**: 每次 `plan`、`review` 和发布前检查 MUST 进行合规审查，验证本宪章条款是否被满足。
- **JA**: 各 `plan`、`review`、リリース前確認では、本憲章への適合性レビューを必ず実施する。
- **EN**: Every `plan`, `review`, and pre-release check MUST include a compliance review against this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-03-24 | **Last Amended**: 2026-03-24
