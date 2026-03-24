# Research: Orchestrated Spec-Kit Command Workflow Platform

## Decision 1: Use a web-first command console with optional future GUI wrapping
- Decision: The first release will use a browser-based web interface as the primary operator console, while keeping the backend APIs reusable for a future desktop wrapper.
- Rationale: A web-first console is the simplest way to expose the spec-kit-like command list, prerequisite states, review results, and artifact links without introducing a second delivery surface too early.
- Alternatives considered:
  - Native desktop GUI: rejected for v1 because it adds packaging and update complexity without changing the workflow model.
  - CLI-first interface: rejected because the constitution requires GUI/Web as the primary user entry point.

## Decision 2: Use FastAPI plus a Python orchestration service for command execution
- Decision: Build the backend as a Python 3.12 service using FastAPI, Pydantic v2, SQLAlchemy 2.x, and Alembic.
- Rationale: This stack keeps the API contract explicit, supports typed validation for command payloads and handoff records, and aligns with the constitution's Python-first rule.
- Alternatives considered:
  - Django: rejected because the product needs a lighter API-centric service with explicit orchestration boundaries.
  - Flask: rejected because more manual structure would be needed for validation, async execution, and OpenAPI generation.

## Decision 3: Persist workflow state in MySQL and keep artifact files on the local filesystem
- Decision: Store workflow runs, command executions, review decisions, communication envelopes, and artifact metadata in MySQL 8.0; store the generated Markdown artifacts in the target workspace on disk.
- Rationale: MySQL satisfies the constitution's mandatory persistence requirement, while filesystem output preserves the spec-kit-like local document workflow users expect.
- Alternatives considered:
  - Store artifact bodies only in MySQL: rejected because users explicitly need local `.md` files they can edit between commands.
  - PostgreSQL: rejected because the constitution requires MySQL as the default persistent store.

## Decision 4: Execute one explicit command at a time with prerequisite validation
- Decision: The Orchestrator Agent will run only the agents required for the user-selected command and will refuse execution when prerequisite artifacts are missing.
- Rationale: This matches the clarified spec-kit interaction model and prevents downstream stages from operating on incomplete or invalid context.
- Alternatives considered:
  - Automatically chain all future commands: rejected because it breaks the explicit command-by-command workflow.
  - Allow force-skipping by default: rejected because it undermines review gates and prerequisite safety.

## Decision 5: Use overwrite-on-rerun with preserved artifact version history
- Decision: When a user reruns the same command, the platform overwrites the target Markdown file paths by default and records prior versions in an artifact history table plus a backup path reference.
- Rationale: This keeps output locations stable for users while preserving traceability and rollback visibility.
- Alternatives considered:
  - Always create duplicate files: rejected because it would create clutter and ambiguous downstream inputs.
  - Prompt for overwrite every time: rejected because it slows the normal rerun workflow and adds avoidable friction.

## Decision 6: Expose the orchestration surface as a REST API with explicit command contracts
- Decision: Publish the backend interface as a versioned REST API described by an OpenAPI contract.
- Rationale: The frontend, future GUI shell, and any automation tools can all consume the same contract, and API testing becomes straightforward.
- Alternatives considered:
  - GraphQL: rejected because the command lifecycle is action-driven and maps naturally to explicit HTTP operations.
  - Internal-only service with no contract artifact: rejected because the planning phase requires interface contracts.

## Decision 7: Keep model routing role-based and configurable
- Decision: Use role-fit public Hugging Face models with a configuration layer that maps each agent to a primary model and optional fallback.
- Rationale: The platform depends on different strengths for orchestration, structured writing, coding, and analysis, and the constitution requires public Hugging Face models only.
- Alternatives considered:
  - One shared model for all agents: rejected because it weakens specialization and makes review/coding quality harder to optimize.
  - Hard-coded model selection in agent code: rejected because model changes should not require deep code edits.

## Decision 8: Favor a thin synchronous UX with asynchronous command execution tracking
- Decision: Command submission returns quickly, while longer-running agent work is tracked through persisted execution state and polled by the UI.
- Rationale: Users need responsive command submission and a stable run timeline, especially when review or implementation steps take longer than a single request lifecycle.
- Alternatives considered:
  - Fully synchronous HTTP requests for all command work: rejected because longer steps would increase timeout and reliability risks.
  - External queue as a hard dependency in v1: rejected because it adds operational complexity before the core workflow is proven.
