---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests remain spec-driven, but key workflow contract tests, inter-agent integration tests, and review-gate validations are REQUIRED for constitution-critical flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story while preserving stage-by-stage agent ownership.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Multi-agent web app (default)**: `backend/src/`, `frontend/src/`, `shared/`, `docs/`
- **Backend agents**: `backend/src/agents/<agent_name>/`
- **Review flow**: `backend/src/review/` or `backend/src/audit/`
- **Contracts and schemas**: `shared/schemas/` and `specs/[feature]/contracts/`
- **Tests**: `backend/tests/`, `frontend/tests/`, `tests/e2e/` or another documented equivalent

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  - Constitution requirements for independent agents, review gates, MySQL,
    GUI/Web delivery, public Hugging Face models, and trilingual docs
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Reviewed independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline structure

- [ ] T001 Create backend, frontend, shared, and docs directory structure per plan
- [ ] T002 Initialize Python backend project and dependencies for orchestration, API, and MySQL access
- [ ] T003 [P] Initialize GUI/Web frontend project and i18n scaffolding
- [ ] T004 [P] Configure linting, formatting, and naming rules for backend, frontend, and SQL artifacts
- [ ] T005 [P] Register initial public Hugging Face model configuration and environment wiring
- [ ] T006 [P] Create Chinese, Japanese, and English documentation directories and templates

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T007 Setup MySQL schema, migrations, and repository base for workflow state
- [ ] T008 [P] Define agent registry, stage contracts, and shared handoff schemas
- [ ] T009 [P] Implement orchestration runtime for stage sequencing and status tracking
- [ ] T010 [P] Implement review-agent checkpoint framework with approve/block/edit outcomes
- [ ] T011 [P] Implement inter-agent context store and message tracing
- [ ] T012 [P] Setup artifact persistence, versioning, and multilingual document linkage
- [ ] T013 Configure API routing, session management, and error handling for workflow execution

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 ⚠️

- [ ] T014 [P] [US1] Contract test for the primary workflow endpoint in backend/tests/contract/test_[name].py
- [ ] T015 [P] [US1] Integration test for agent-to-agent handoff in backend/tests/integration/test_[name].py
- [ ] T016 [P] [US1] Review-gate test covering approve/block behavior in backend/tests/integration/test_[name]_review.py

### Implementation for User Story 1

- [ ] T017 [P] [US1] Define the stage agent input/output schema in shared/schemas/[name].json
- [ ] T018 [P] [US1] Implement the owning stage agent in backend/src/agents/[agent_name]/service.py
- [ ] T019 [P] [US1] Configure the assigned public Hugging Face model and fallback mapping
- [ ] T020 [US1] Implement backend orchestration and persistence for the story flow
- [ ] T021 [US1] Implement GUI/Web experience for story input and result display
- [ ] T022 [US1] Add Chinese, Japanese, and English artifact rendering for the story
- [ ] T023 [US1] Wire the review-agent checkpoint and remediation loop

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 ⚠️

- [ ] T024 [P] [US2] Contract test for the story endpoint or action in backend/tests/contract/test_[name].py
- [ ] T025 [P] [US2] Integration test for the relevant stage agent and downstream handoff
- [ ] T026 [P] [US2] Review-agent regression test for key artifact changes

### Implementation for User Story 2

- [ ] T027 [P] [US2] Define or extend shared schemas for this story in shared/schemas/[name].json
- [ ] T028 [P] [US2] Implement or extend the responsible agent in backend/src/agents/[agent_name]/service.py
- [ ] T029 [P] [US2] Add or adjust the public Hugging Face model configuration for this story
- [ ] T030 [US2] Implement backend workflow and MySQL persistence updates
- [ ] T031 [US2] Implement frontend/UI changes for this story
- [ ] T032 [US2] Add trilingual output and validation for story-specific artifacts
- [ ] T033 [US2] Integrate review-agent handling and user-visible feedback

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 ⚠️

- [ ] T034 [P] [US3] Contract test for the workflow extension in backend/tests/contract/test_[name].py
- [ ] T035 [P] [US3] Integration test for multi-stage coordination in backend/tests/integration/test_[name].py
- [ ] T036 [P] [US3] End-to-end test for UI input through reviewed artifact output in tests/e2e/test_[name].py

### Implementation for User Story 3

- [ ] T037 [P] [US3] Extend agent schemas or message types in shared/schemas/[name].json
- [ ] T038 [P] [US3] Implement the relevant stage or review behavior in backend/src/agents/[agent_name]/service.py
- [ ] T039 [P] [US3] Tune the assigned Hugging Face model usage, prompts, or fallbacks
- [ ] T040 [US3] Implement backend orchestration, review, and MySQL changes
- [ ] T041 [US3] Implement frontend/UI updates for this story
- [ ] T042 [US3] Add or update trilingual artifact support

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Review and align Chinese, Japanese, and English documentation in docs/
- [ ] TXXX Normalize naming, simplify code paths, and remove avoidable complexity
- [ ] TXXX Tune model routing, retries, and fallback behavior across agents
- [ ] TXXX [P] Add or extend end-to-end workflow coverage in tests/e2e/
- [ ] TXXX Validate review-agent policies, audit logs, and operator visibility
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
  - Story work can proceed in parallel only when file ownership is independent
  - Stage execution in the product flow remains ordered by agent handoff and review approval
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Workflow Dependencies

- A downstream stage MUST NOT execute before its upstream artifact exists and the required review gate has passed
- Model assignment, communication schema, and persistence tasks should precede feature logic for the owning stage
- GUI/Web tasks depend on stable backend contracts for the same story

### Within Each User Story

- Contract and integration tests MUST be written before or alongside implementation for constitution-critical flows
- Shared schemas before agent implementation
- Agent implementation before orchestration wiring
- Orchestration before frontend integration
- Review-gate behavior before story signoff

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel when they do not edit the same files
- Different user stories can be implemented in parallel after the foundation is ready
- Distinct agent implementations can run in parallel if contracts are stable and ownership is clear

---

## Parallel Example: Multi-Agent Platform

```text
Task: "Define specify-agent schema in shared/schemas/specify.json"
Task: "Implement review-agent checkpoint service in backend/src/agents/review_agent/service.py"
Task: "Create frontend workflow timeline component in frontend/src/components/workflow-timeline.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate end-to-end: UI input -> stage agent -> review agent -> stored artifact
5. Demo or deploy the MVP flow

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Review -> Test independently -> Deploy/Demo
3. Add User Story 2 -> Review -> Test independently -> Deploy/Demo
4. Add User Story 3 -> Review -> Test independently -> Deploy/Demo
5. Each story adds value without bypassing review gates

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: Backend/stage agent for current story
   - Developer B: Frontend/UI flow for current story
   - Developer C: Review-agent and integration coverage
3. Integrate only after required review checkpoints pass

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Every story should preserve dedicated agent ownership and reviewability
- Avoid vague tasks, hidden shared-file conflicts, and undocumented model choices
