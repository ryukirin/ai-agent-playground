---

description: "Task list for implementing the orchestrated spec-kit command workflow platform"
---

# Tasks: Orchestrated Spec-Kit Command Workflow Platform

**Input**: Design documents from `/specs/001-multi-agent-specflow/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/workflow-api.yaml, quickstart.md

**Tests**: Contract tests, integration tests, review-gate validations, rerun/version-history checks, local-artifact reload checks, performance validations, and end-to-end command-flow tests are REQUIRED for this feature because command gating, review blocking, and local artifact behavior are core workflow guarantees.

**Organization**: Tasks are grouped by user story so each command-flow capability can be implemented, tested, and reviewed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an exact file path

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`, `backend/migrations/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Shared contracts/schemas**: `shared/schemas/`, `specs/001-multi-agent-specflow/contracts/`
- **End-to-end tests**: `tests/e2e/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the project structure and baseline tooling for a web-first, Python-backed, multi-agent command workflow.

- [ ] T001 Create the base project directories in backend/src/.gitkeep
- [ ] T002 Initialize the Python backend package and dependency manifest in backend/pyproject.toml
- [ ] T003 [P] Initialize the frontend workspace and build tooling in frontend/package.json
- [ ] T004 [P] Configure backend/frontend linting, formatting, and test settings in backend/pytest.ini
- [ ] T005 [P] Add environment and model configuration examples in .env.example
- [ ] T006 [P] Create local artifact output and backup directory guidance in docs/output/README.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared data, orchestration, review, and API foundations that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T007 Implement the initial MySQL schema and migration for workflow core entities in backend/migrations/versions/001_workflow_core.py
- [ ] T008 [P] Create workflow and command ORM models in backend/src/models/workflow_run.py
- [ ] T009 [P] Create artifact, artifact-version, and review ORM models in backend/src/models/artifact_document.py
- [ ] T010 [P] Define shared API and handoff schemas in shared/schemas/workflow.py
- [ ] T011 [P] Implement repository classes for runs, commands, artifacts, and reviews in backend/src/repositories/workflow_repository.py
- [ ] T012 [P] Implement the orchestrator runtime and command prerequisite evaluator in backend/src/orchestration/orchestrator_service.py
- [ ] T013 [P] Implement the review checkpoint service with approve/revise/block outcomes in backend/src/review/review_service.py
- [ ] T014 Implement the base FastAPI router, dependency wiring, and error mapping in backend/src/api/app.py

**Checkpoint**: Foundation ready; user-story implementation can now proceed.

---

## Phase 3: User Story 1 - Choose And Run One Command (Priority: P1) 🎯 MVP

**Goal**: Let users explicitly choose one spec-kit-style command, run only that command, and receive its Markdown outputs.

**Independent Test**: From the UI, create a workflow run, choose `specify`, execute it, and verify only the `specify` command runs and only its expected Markdown outputs are written.

### Tests for User Story 1

- [ ] T015 [P] [US1] Add contract tests for `GET /api/commands` and `POST /api/runs/{runId}/commands` in backend/tests/contract/test_command_api.py
- [ ] T016 [P] [US1] Add integration tests for orchestrator command selection and stage dispatch in backend/tests/integration/test_command_execution.py
- [ ] T017 [P] [US1] Add end-to-end UI test for choosing and running the `specify` command in tests/e2e/test_us1_choose_command.spec.ts
- [ ] T018 [P] [US1] Add integration tests for loading the latest user-edited local artifacts before the next command in backend/tests/integration/test_local_artifact_reload.py

### Implementation for User Story 1

- [ ] T019 [P] [US1] Implement command availability and execution endpoints in backend/src/api/routes/commands.py
- [ ] T020 [P] [US1] Implement the orchestrator agent service for one-command-at-a-time execution in backend/src/agents/orchestrator_agent/service.py
- [ ] T021 [P] [US1] Implement the specify-stage agent adapter in backend/src/agents/specify_agent/service.py
- [ ] T022 [P] [US1] Configure role-fit model selection and fallback loading for command agents in backend/src/services/model_router.py
- [ ] T023 [P] [US1] Implement latest-local-artifact reload and source-of-truth resolution before command dispatch in backend/src/services/artifact_loader.py
- [ ] T024 [US1] Implement local Markdown artifact writing and stable path generation in backend/src/services/artifact_writer.py
- [ ] T025 [US1] Build the command selection page with disabled-command states in frontend/src/pages/command-console.tsx
- [ ] T026 [US1] Build the run creation and output summary UI flow in frontend/src/components/run-summary.tsx

**Checkpoint**: User Story 1 should now be independently functional and demoable as the MVP.

---

## Phase 4: User Story 2 - Govern Each Step With Review (Priority: P2)

**Goal**: Enforce review-agent approval, blocking reasons, manual correction, and rerun behavior for each command.

**Independent Test**: Trigger a command that produces a review-blocked artifact, confirm the rejection reason is shown, manually edit the file, rerun the same command, and verify the target file is overwritten with version history preserved.

### Tests for User Story 2

- [ ] T027 [P] [US2] Add contract tests for blocked command execution and rerun behavior in backend/tests/contract/test_review_api.py
- [ ] T028 [P] [US2] Add integration tests for review blocking, rejection reasons, and rerun overwrite/version history in backend/tests/integration/test_review_rerun_flow.py
- [ ] T029 [P] [US2] Add integration tests for review-model fallback selection on implementation-heavy artifacts in backend/tests/integration/test_review_model_fallback.py
- [ ] T030 [P] [US2] Add end-to-end UI test for blocked review and rerun flow in tests/e2e/test_us2_review_block.spec.ts

### Implementation for User Story 2

- [ ] T031 [P] [US2] Implement the review agent adapter in backend/src/agents/review_agent/service.py
- [ ] T032 [P] [US2] Implement rerun orchestration and blocked-command recovery in backend/src/orchestration/rerun_service.py
- [ ] T033 [P] [US2] Implement artifact version persistence and backup metadata handling in backend/src/services/artifact_version_service.py
- [ ] T034 [P] [US2] Configure review-agent default and code-review fallback model selection in backend/src/services/model_router.py
- [ ] T035 [US2] Extend command execution endpoints to expose review status and rejection reasons in backend/src/api/routes/commands.py
- [ ] T036 [US2] Build the review detail panel and rerun action UI in frontend/src/components/review-result-panel.tsx
- [ ] T037 [US2] Build artifact version history and overwrite-state display in frontend/src/components/artifact-history-panel.tsx

**Checkpoint**: User Stories 1 and 2 should both work independently, including blocked-review recovery.

---

## Phase 5: User Story 3 - Follow Command Progress And Dependencies (Priority: P3)

**Goal**: Show command history, prerequisite dependency status, participating agents, and model usage so operators can safely choose the next step.

**Independent Test**: Run multiple commands in sequence and verify the UI shows history, prerequisite blocks, command timelines, participating agents, and model assignments.

### Tests for User Story 3

- [ ] T038 [P] [US3] Add contract tests for workflow detail and artifact listing endpoints in backend/tests/contract/test_workflow_detail_api.py
- [ ] T039 [P] [US3] Add integration tests for prerequisite validation and command-history visibility in backend/tests/integration/test_workflow_history.py
- [ ] T040 [P] [US3] Add end-to-end UI test for command timeline and dependency visibility in tests/e2e/test_us3_workflow_timeline.spec.ts

### Implementation for User Story 3

- [ ] T041 [P] [US3] Implement workflow detail and artifact listing endpoints in backend/src/api/routes/workflow_runs.py
- [ ] T042 [P] [US3] Implement command history and communication-envelope query services in backend/src/services/workflow_query_service.py
- [ ] T043 [P] [US3] Implement the clarify-stage agent adapter in backend/src/agents/clarify_agent/service.py
- [ ] T044 [P] [US3] Implement the plan-stage agent adapter in backend/src/agents/plan_agent/service.py
- [ ] T045 [P] [US3] Implement the tasks-stage agent adapter in backend/src/agents/tasks_agent/service.py
- [ ] T046 [P] [US3] Implement the implement-stage agent adapter in backend/src/agents/implement_agent/service.py
- [ ] T047 [P] [US3] Implement the analyze-stage agent adapter and execution timeline aggregation in backend/src/agents/analyze_agent/service.py
- [ ] T048 [US3] Build the workflow timeline and command history page in frontend/src/pages/workflow-run-detail.tsx
- [ ] T049 [US3] Build the prerequisite explanation and model-assignment panels in frontend/src/components/command-timeline.tsx

**Checkpoint**: All user stories should now be independently functional and operationally transparent.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Improve reliability, consistency, and operator experience across all stories.

- [ ] T050 [P] Add cross-command contract and schema validation coverage in backend/tests/contract/test_schema_consistency.py
- [ ] T051 [P] Add benchmark coverage for command-availability load, prerequisite-check latency, and command completion targets in backend/tests/integration/test_performance_targets.py
- [ ] T052 Normalize naming, simplify duplicated service paths, and align code style in backend/src/
- [ ] T053 [P] Tune model routing, fallback behavior, and retry handling in backend/src/services/model_router.py
- [ ] T054 [P] Validate and document quickstart accuracy as documentation and operability support in specs/001-multi-agent-specflow/quickstart.md
- [ ] T055 Validate audit logging, review visibility, and operator-facing error messages in backend/src/review/review_service.py

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion; forms the MVP.
- **User Story 2 (Phase 4)**: Depends on User Story 1 because review blocking and rerun behavior build on command execution.
- **User Story 3 (Phase 5)**: Depends on User Stories 1 and 2 because command history and dependency visibility require command execution and review state.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1**: No dependency on later stories; delivers explicit one-command execution and local artifact output.
- **US2**: Requires US1 command execution flow and artifact writing to exist.
- **US3**: Requires US1 execution records and US2 review/rerun state to provide a complete operator timeline.

### Within Each User Story

- Contract, integration, and end-to-end tests should be added before or alongside implementation tasks for the same story.
- API contracts and shared schemas should precede service logic when both are introduced in the same story.
- Backend orchestration changes should land before frontend views that depend on them.
- Review-state and artifact-version handling must exist before rerun UX is considered complete.

### Parallel Opportunities

- T003, T004, T005, and T006 can run in parallel after T002 is started.
- T008, T009, T010, T011, T012, and T013 can proceed in parallel after T007 is defined.
- In US1, T019 through T023 can be split across backend contributors while T025 and T026 proceed on the frontend once the contracts are stable.
- In US2, T031 through T034 can run in parallel with T036 and T037 after the API payloads are known.
- In US3, T041 through T047 can be distributed by agent ownership, while T048 and T049 proceed in parallel on the frontend.

---

## Parallel Example: User Story 1

```text
Task: "Implement command availability and execution endpoints in backend/src/api/routes/commands.py"
Task: "Implement the orchestrator agent service in backend/src/agents/orchestrator_agent/service.py"
Task: "Build the command selection page in frontend/src/pages/command-console.tsx"
```

## Parallel Example: User Story 2

```text
Task: "Implement the review agent adapter in backend/src/agents/review_agent/service.py"
Task: "Implement artifact version persistence in backend/src/services/artifact_version_service.py"
Task: "Build the review detail panel in frontend/src/components/review-result-panel.tsx"
```

## Parallel Example: User Story 3

```text
Task: "Implement workflow detail endpoints in backend/src/api/routes/workflow_runs.py"
Task: "Implement command history queries in backend/src/services/workflow_query_service.py"
Task: "Build the workflow timeline page in frontend/src/pages/workflow-run-detail.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup.
2. Complete Foundational.
3. Complete User Story 1.
4. Validate from UI command selection to local Markdown output.
5. Demo the MVP before adding review-blocked reruns and timeline features.

### Incremental Delivery

1. Deliver US1 for explicit one-command execution.
2. Add US2 for review blocking, rejection reasons, and rerun/version history.
3. Add US3 for timeline visibility, dependency guidance, and multi-command traceability.
4. Finish with polish, performance validation, and quickstart operability validation.

### Parallel Team Strategy

1. One backend stream owns orchestration, review, and persistence.
2. One frontend stream owns command console, review views, and workflow timeline.
3. One validation stream owns contract, integration, and end-to-end tests.
4. Integrate only after the review-gated flows remain consistent across API, UI, and local artifact behavior.

---

## Notes

- `[P]` tasks operate on different files with no direct dependency on incomplete sibling tasks.
- `[US1]`, `[US2]`, and `[US3]` labels map directly to prioritized user stories in `spec.md`.
- Every story preserves explicit command selection, reviewability, and local Markdown artifact behavior.
- `T054` is a documentation and operability support task so quickstart guidance stays aligned with the implemented workflow.
- Avoid introducing tasks that blur agent ownership, bypass prerequisite validation, or hide review-block reasons.
