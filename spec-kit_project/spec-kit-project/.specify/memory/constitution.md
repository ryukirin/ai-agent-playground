<!--
Sync Impact Report
- Version change: 1.0.0 -> 2.0.0
- Modified principles:
  - Principle V: Trilingual Delivery and Simple Code Style -> Simple Code Style and Uniform Naming
- Added sections:
  - None
- Removed sections:
  - Trilingual delivery requirement from principle, constraints, workflow gates, and validation language checks
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

### I. Step-Isolated Multi-Agent Workflow
- Every spec-kit stage, including `specify`, `clarify`, `plan`, `tasks`, `implement`, and `analyze`, MUST be owned by a dedicated agent.
- Each agent MUST consume approved inputs only and emit explicit artifacts.
- Stage skipping, blended ownership, and direct overwrites of another stage's primary output are prohibited.
- Rationale: Step isolation keeps the workflow auditable, replaceable, and easy to evolve as the platform grows.

### II. Structured Inter-Agent Communication
- Agents MUST communicate through versioned documents, structured JSON payloads, shared context summaries, and explicit handoff metadata.
- Every transfer MUST record source, destination, model, input summary, output path, and status.
- Rationale: Structured handoffs are required for cross-agent continuity, debugging, replay, and safe model substitution.

### III. Review-Agent Quality Gates
- A dedicated review agent is mandatory at the `spec`, `plan`, `tasks`, major implementation-artifact, and pre-release checkpoints.
- The review agent MAY edit important files directly, but each intervention MUST include rationale, change notes, and a blocking or non-blocking decision for downstream stages.
- Rationale: A formal review gate catches cross-stage defects early and keeps important artifacts trustworthy.

### IV. Role-Fit Hugging Face Model Selection
- All agent models MUST be selected from publicly available Hugging Face models.
- Each agent MUST document its chosen model, role-fit rationale, known limitations, fallback plan, and replacement triggers.
- Selection MUST follow the model's comparative strengths in reasoning, coding, summarization, and review instead of forcing a single model on every role.
- Rationale: Role-fit model assignment improves quality, cost control, and resilience.

### V. Simple Code Style and Uniform Naming
- Code MUST favor simple implementation, low cognitive load, and uniform naming.
- Python uses `snake_case` for functions and variables, `PascalCase` for classes, and `UPPER_SNAKE_CASE` for constants.
- Database tables and columns use `snake_case`.
- Routes and frontend paths use `kebab-case` or another team-wide convention documented once and reused everywhere.
- Rationale: Simple and uniform code keeps the multi-agent system maintainable.

## Architecture & Delivery Constraints

- The primary user entry point MUST be a GUI or web frontend; CLI support is optional and secondary.
- Backend orchestration, business logic, agent runtime, and review flow SHOULD be implemented in Python unless a simpler and better-documented exception is approved in the plan.
- MySQL is the mandatory persistence layer and MUST store workflow sessions, artifact metadata, review records, message indexes, model assignments, and audit logs.
- Important files MUST use UTF-8 encoding.
- Final workflow artifacts MUST be written as local Markdown files.

## Workflow & Quality Gates

1. Every feature `spec` MUST define the agent roster, stage inputs and outputs, review checkpoints, frontend interaction mode, MySQL persistence scope, and local artifact output scope.
2. The `plan` MUST include a Constitution Check covering independent agents, review-agent gates, structured communication, Hugging Face model mapping, Python/MySQL/Web constraints, local Markdown output, and uniform naming.
3. `tasks` MUST explicitly include review gates, agent communication contracts, MySQL changes, frontend/backend integration, Markdown artifact handling, and naming/style verification tasks; omission means the plan is incomplete.
4. Critical stages MUST NOT proceed downstream before review-agent approval. Human override is allowed ONLY when rationale, risk, and a remediation plan are recorded.
5. Before merge, every deliverable MUST pass at least one end-to-end workflow validation proving GUI/Web input, agent chaining, review gates, MySQL persistence, and local Markdown output all function together.

## Governance

- This constitution supersedes other repository process guidance. Any exception to architecture, model source, database, entry interface, or artifact output format MUST be recorded in the `plan` and approved by both the review agent and the responsible owner.
- Amendments MUST include the motivation, impacted principles, template sync status, migration impact, and version-bump rationale.
- Versioning follows semantic rules: principle removal or redefinition is MAJOR; new principles, mandatory gates, or material constraints are MINOR; wording-only clarifications are PATCH.
- Every `plan`, `review`, and pre-release check MUST include a compliance review against this constitution.

**Version**: 2.0.0 | **Ratified**: 2026-03-24 | **Last Amended**: 2026-03-24
