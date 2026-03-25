# Implementation Plan: Orchestrated Spec-Kit Command Workflow Platform

**Branch**: `[001-multi-agent-specflow]` | **Date**: 2026-03-24 | **Spec**: `/specs/001-multi-agent-specflow/spec.md`
**Input**: Feature specification from `/specs/001-multi-agent-specflow/spec.md`

**Note**: This plan covers Phase 0 research and Phase 1 design artifacts for the command-by-command, multi-agent workflow platform.

## Summary

Build a web-first, Python-backed platform that runs spec-kit-style commands one at a time through an Orchestrator Agent. Each selected command activates only the required stage agents, enforces prerequisite validation, routes important outputs through a Review Agent, writes local Markdown artifacts to the workspace, preserves version history on rerun, and keeps write-finalization recovery state visible when review has passed but local persistence is incomplete.

## Technical Context

**Language/Version**: Python 3.12 backend, TypeScript 5.x frontend  
**Primary Dependencies**: FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, MySQL driver, React, Vite, Playwright, Hugging Face inference integration  
**Storage**: MySQL 8.0 for workflow state, review records, metadata, prerequisite evidence, source-of-truth reconciliation, and version history; local filesystem for Markdown artifacts and retained backups  
**Testing**: pytest, pytest-asyncio, httpx, contract validation, Playwright end-to-end tests  
**Target Platform**: Browser-based web application for operators, with optional future desktop wrapper  
**Project Type**: Multi-agent web application  
**Performance Goals**: Command availability loads in under 2 seconds; prerequisite validation returns in under 1 second; 95% of successful command runs finish within 5 minutes; reruns overwrite target files idempotently; artifact audit lookups resolve command, review, model, and path lineage in under 1 minute  
**Constraints**: Public Hugging Face models only, explicit one-command-at-a-time workflow, no skipping required prerequisites, review-agent gates, local Markdown artifact output, overwrite-on-rerun with version history, recoverable incomplete write state, simple code style, uniform naming  
**Scale/Scope**: Initial release supports one workspace at a time, six core commands, dozens of runs per day, and hundreds of artifact revisions per workspace  
**Agent Roles**: Orchestrator Agent, Specify Agent, Clarify Agent, Plan Agent, Tasks Agent, Implement Agent, Analyze Agent, Review Agent  
**Model Strategy**: `Qwen/Qwen2.5-14B-Instruct` for orchestration and structured writing roles, `Qwen/Qwen3-Coder-30B-A3B-Instruct` for implementation-heavy coding, `deepseek-ai/DeepSeek-Coder-V2-Instruct` for analysis, with per-agent fallback mappings stored in configuration  
**Artifact Output**: Local Markdown files written into the selected workspace and feature directory, with stable paths across reruns  
**Retention/Privacy**: Workflow history is retained until explicit operator deletion; superseded artifact backups are retained at least 30 days after supersession or run abandonment; persisted envelopes store summaries and refs, not secrets or credential material  
**Consistency Model**: MySQL is the system of record. Command acceptance, prerequisite evidence, and pending write-finalization state must be durable before agent dispatch or final completion. Review-approved but write-incomplete commands remain recoverable without rerunning approved agent work.  
**Query/Index Targets**: Add indexes on workspace/feature key, command status/timestamps, artifact path/version, review timestamps, communication chronology, and command-history timeline retrieval to satisfy command availability, prerequisite validation, and audit lookup targets  
**Dependency Handling**: Hugging Face outages, fallback exhaustion, and MySQL outages must be recorded explicitly so operators can distinguish dependency failures from review blocks or ordinary execution failures
**Workspace Boundary**: Accepted workspaces must be canonical absolute local paths under configured allowed workspace roots; relative paths, non-local URIs, and canonicalized paths that escape the allowed roots are rejected before run creation or artifact writing.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Each spec-kit stage is assigned to a dedicated agent with explicit inputs and outputs.
- [x] Review-agent checkpoints are defined for `spec`, `plan`, `tasks`, major artifacts, and pre-release validation.
- [x] Inter-agent communication uses structured payloads, versioned artifacts, and traceable handoff metadata.
- [x] Every agent is mapped to a publicly available Hugging Face model with role-fit justification and fallback notes.
- [x] The solution keeps Python as the backend default, MySQL as the persistent store, and GUI/Web as the primary user entry.
- [x] Local Markdown artifact output is defined for generated deliverables.
- [x] Naming conventions and simple-code rules are documented for backend, database, API, and frontend paths.
- [x] Any deviation from the constitution is logged in Complexity Tracking with approval rationale.

## Project Structure

### Documentation (this feature)

```text
specs/001-multi-agent-specflow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── workflow-api.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── agents/
│   │   ├── orchestrator_agent/
│   │   ├── specify_agent/
│   │   ├── clarify_agent/
│   │   ├── plan_agent/
│   │   ├── tasks_agent/
│   │   ├── implement_agent/
│   │   ├── analyze_agent/
│   │   └── review_agent/
│   ├── api/
│   ├── orchestration/
│   ├── review/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   └── db/
├── migrations/
└── tests/
    ├── contract/
    ├── integration/
    └── unit/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── routes/
└── tests/

shared/
├── schemas/
├── prompts/
└── types/
```

**Structure Decision**: Use a web app split into `backend` and `frontend`, with agent logic isolated under `backend/src/agents/`, orchestration and review concerns separated into dedicated modules, shared schemas stored in `shared/`, and history/recovery state modeled explicitly so audit, rollback, and UI views derive from the same persisted records.

## Data Design Commitments

- Persist prerequisite evidence for both blocked and accepted command requests.
- Represent reruns as new `CommandExecution` rows linked to earlier blocked, failed, or incomplete attempts.
- Keep `OutputBundle` as a derived read model instead of an independent table.
- Preserve stable artifact paths while incrementing version history and recording backup status.
- Surface incomplete post-review write failures as recoverable workflow state rather than silently collapsing them into generic failures.

## Complexity Tracking

No constitutional deviations identified at planning time.

