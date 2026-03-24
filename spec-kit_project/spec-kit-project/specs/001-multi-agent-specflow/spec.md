# Feature Specification: Orchestrated Spec-Kit Command Workflow Platform

**Feature Branch**: `[001-multi-agent-specflow]`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "使用multi-agent来自动跑 spec-kit 的流程；用户输入在图形化界面或者网页端（哪个方便用哪个）；每个 Agent 之间由 Orchestrator Agent 统一调度；最终直接生成 .md 文件到本地；使用 HuggingFace 上的模型；额外有审议 agent，并且 agent 之间可以通信，最好是根据各个模型擅长的方面选取不同模型，各司其职。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose And Run One Command (Priority: P1)

As a product user, I choose a single spec-kit-style command from a visual interface and receive only the Markdown artifacts for that command, so I can move through the workflow step by step instead of triggering every stage at once.

**Why this priority**: This is the core operating model of the product. If users cannot explicitly control each workflow step, the platform no longer behaves like spec-kit.

**Independent Test**: Choose one command from the primary interface, run it, and verify that the system generates only that command's expected `.md` files in the local workspace.

**Acceptance Scenarios**:

1. **Given** a user is on the command screen with a valid workspace selected, **When** the user chooses `specify` and submits a feature description, **Then** the orchestrated workflow runs only the agents needed for `specify` and writes only the `specify` output files.
2. **Given** a command run completes successfully, **When** the user opens the output summary, **Then** the user can see which artifacts were created for that command, where they were written, and which agents participated.
3. **Given** a command has already generated its Markdown artifacts, **When** the user edits those local files and then chooses the next command, **Then** the next command uses the updated local files as its input source.

---

### User Story 2 - Govern Each Step With Review (Priority: P2)

As a product owner or operator, I want an independent review agent to inspect important artifacts produced by the currently selected command before the next critical step is considered complete, so that low-quality or inconsistent outputs are corrected or blocked before the user proceeds.

**Why this priority**: The command-by-command workflow is only trustworthy if each important step has a formal quality gate.

**Independent Test**: Run a command with a seeded artifact issue and verify that the review step either revises the artifact or blocks completion of that command while recording the reason.

**Acceptance Scenarios**:

1. **Given** a command produces an artifact that violates workflow expectations, **When** the review checkpoint evaluates it, **Then** the review agent records a decision to approve, revise, or block before that command is marked complete.
2. **Given** the review agent revises or blocks an artifact, **When** the user views the command details, **Then** the user can see the rationale, the affected file, the resulting command status, and any rejection reason that must be addressed before rerun.
3. **Given** a command is blocked by the review agent, **When** the user decides how to continue, **Then** the system requires the user to manually edit the relevant files and rerun the same command instead of auto-advancing.

---

### User Story 3 - Follow Command Progress And Dependencies (Priority: P3)

As an operator, I want to see which command is being run, which agents were coordinated by the Orchestrator Agent, and whether prerequisite artifacts are already available, so that I can understand progress, troubleshoot failures, and safely decide the next command to run.

**Why this priority**: Transparent command sequencing and dependency visibility reduce user confusion and prevent invalid step ordering.

**Independent Test**: Execute several commands in sequence and verify that the interface shows command history, prerequisite checks, participating agents, and the model used by each agent.

**Acceptance Scenarios**:

1. **Given** a workflow command is in progress or completed, **When** the user opens its timeline, **Then** the interface shows the selected command, responsible agents, handoff status, and review result.
2. **Given** a user selects a command whose prerequisites are missing, **When** the system validates the request, **Then** the system blocks execution and tells the user which prerequisite artifact or prior command is required.
3. **Given** a user tries to jump to a later command before earlier required steps are complete, **When** the interface evaluates command availability, **Then** the later command remains disabled and explains which required step must be completed first.
4. **Given** the user opens the command list, **When** some commands are not yet runnable, **Then** the interface still shows the full command list, disables unavailable commands, and displays the missing prerequisite for each blocked command.

## Clarifications

### Session 2026-03-24

- Q: Should one user input automatically generate all workflow files at once? → A: No. The product must behave like spec-kit: the user explicitly chooses a command each time, and the system generates only the files for that selected step.
- Q: How should command availability be shown in the UI? → A: Show all commands, disable unavailable ones, and explain the missing prerequisite.
- Q: After one step generates files, can the user manually edit them before continuing? → A: Yes. The next command reads the user's updated local files as input.
- Q: What should happen when the review agent blocks a command? → A: The command stays incomplete, the system shows the rejection reason, and the user manually edits the files before rerunning the same command.
- Q: Can users skip required steps and run later commands directly? → A: No. Required steps cannot be skipped; commands stay blocked until prerequisite artifacts exist.
- Q: When rerunning the same command, how should existing files be handled? → A: Overwrite the existing target files by default, while preserving history or version information for traceability.

## Agent Workflow & Review *(mandatory)*

- **Stage Agents**: The platform includes dedicated agents for `specify`, `clarify`, `plan`, `tasks`, `implement`, and `analyze`. Each command activates only the agents required for that selected step. Each participating agent receives the approved artifact package from the relevant prior step, or the latest user-edited local files when the user has modified them, produces its own primary output, and returns status plus output metadata to the Orchestrator Agent.
- **Review Agent**: A separate review agent evaluates important artifacts created during the active command, including `spec`, `plan`, `tasks`, major implementation artifacts, and final outputs for that step. The review agent may approve, revise, or block an artifact. Every intervention must be visible to the user before the command is marked complete, and every block decision must include an explicit rejection reason visible in the interface.
- **Inter-Agent Communication**: All collaboration flows through the Orchestrator Agent. Agents exchange structured handoff payloads, artifact references, execution summaries, prerequisite results, and review outcomes so the selected command inherits the right context without triggering unrelated downstream stages.
- **Model Assignment**: The default role fit is: Orchestrator Agent -> `Qwen/Qwen2.5-14B-Instruct` for structured coordination; `specify`, `clarify`, `plan`, and `tasks` agents -> `Qwen/Qwen2.5-14B-Instruct` for long-context planning and artifact generation; `implement` agent -> `Qwen/Qwen3-Coder-30B-A3B-Instruct` for code-heavy generation and repository-scale reasoning; `analyze` agent -> `deepseek-ai/DeepSeek-Coder-V2-Instruct` for code intelligence and defect analysis; Review Agent -> `Qwen/Qwen2.5-14B-Instruct` as the default evaluator, with a code-review fallback profile available when the reviewed artifact is implementation-heavy. This model mapping is an initial operating profile and must remain configurable per deployment.

## Technical Constraints *(mandatory)*

- **Backend**: The product uses a Python-based orchestration backend as the system of record for command runs, agent dispatch, review checkpoints, prerequisite checks, and local artifact generation.
- **Frontend/Input**: The primary user entry is a web interface because it is the simplest default for broad access; a GUI wrapper may reuse the same command flow if it proves more convenient without changing the user-facing behavior. The interface shows all supported commands, disables unavailable ones, presents the missing prerequisite for each blocked command, and does not allow users to bypass required workflow order.
- **Database**: MySQL stores workflow sessions, command history, stage status, artifact metadata, review outcomes, agent communication records, model assignments, prerequisite validation results, and resumable run state.
- **Artifact Output**: Important generated workflow artifacts are written as local Markdown files in the target workspace, and each command writes only the artifacts assigned to that command. When users manually edit those local files, the latest saved version becomes the default input for the next command. When the same command is rerun, existing target files are overwritten by default, but the system preserves history or version information for traceability.
- **Naming & Style**: The product favors simple structures, consistent naming, low-friction maintenance, and uniform conventions across workflow stages, data records, and generated files.

### Edge Cases

- If a user selects a command before its prerequisite artifact exists, the Orchestrator Agent must block execution and identify the missing prior step.
- If a user attempts to skip a required step and run a later command directly, the system must reject the request and keep the later command unavailable until the prerequisite artifacts exist.
- If a user edits local files after one command finishes, the next command must read the latest saved file state instead of an older cached snapshot.
- If a stage agent produces an output that conflicts with the approved upstream context, the Orchestrator Agent pauses the active command and routes the artifact to the review checkpoint.
- If the review agent blocks an artifact, the active command must stop at that checkpoint, preserve the artifact, show the rejection reason, and direct the user to manually edit the files before rerunning the same command.
- If local Markdown writing fails after a command step succeeds, the workflow must preserve the approved artifact state and support retrying the write without rerunning already approved work.
- If the preferred model for a role is unavailable or underperforms, the workflow must switch to a configured fallback profile and log that decision in the command history.
- If local Markdown output succeeds for some artifacts but fails for others, the platform must mark that command as incomplete and show which files require retry or recovery.
- If a user reruns the same command after previous output already exists, the system must overwrite the target files consistently and preserve prior version history for audit and rollback reference.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let a user submit a request from a graphical or web interface without requiring direct command-line interaction.
- **FR-002**: The system MUST let the user explicitly choose which spec-kit-style command to run next.
- **FR-003**: The system MUST let the Orchestrator Agent start, sequence, and monitor only the agents required for the selected command.
- **FR-004**: The system MUST provide a dedicated agent for each enabled spec-kit stage rather than merging all stages into one general worker.
- **FR-005**: The system MUST validate command prerequisites before execution and block commands whose required prior artifacts are missing.
- **FR-005a**: The system MUST NOT allow users to skip required workflow steps when prerequisite artifacts are missing.
- **FR-006**: The system MUST allow agents to exchange context through traceable handoff records mediated by the Orchestrator Agent.
- **FR-007**: The system MUST produce local Markdown artifacts for the selected command only and make their output paths visible to the user.
- **FR-008**: The system MUST NOT automatically run future workflow commands unless the user explicitly triggers them.
- **FR-009**: The system MUST support a dedicated review agent that can approve, revise, or block important artifacts before the active command completes, and every block must include a user-visible rejection reason.
- **FR-010**: The system MUST retain command history, artifact lineage, review outcomes, and model-role usage so that completed or failed runs can be audited later.
- **FR-011**: The system MUST let operators see the current command, responsible agent set, review status, and final run outcome for every execution.
- **FR-012**: The system MUST use publicly available Hugging Face models for agent execution and keep the role-to-model mapping configurable.
- **FR-013**: The system MUST support model-role specialization so that different agents can use different model profiles based on their main strengths.
- **FR-014**: The system MUST preserve communication records between agents in a way that supports resuming interrupted runs.
- **FR-015**: The system MUST write important generated workflow artifacts as local Markdown files.
- **FR-015a**: When rerunning the same command, the system MUST overwrite the existing target files by default and preserve version history or equivalent traceability metadata.
- **FR-016**: The system MUST prevent a command from being marked complete when a required review checkpoint remains unresolved.
- **FR-017**: The system MUST allow an operator to inspect which artifacts were revised or blocked by the review agent and why.
- **FR-020**: The system MUST require the user to manually edit affected files before rerunning a command that was blocked by review.
- **FR-018**: The system MUST show all supported commands in the interface and visually disable commands that are currently blocked by missing prerequisites or required workflow order.
- **FR-019**: The system MUST use the latest user-edited local artifact files as the default input source for the next command.

### Key Entities *(include if feature involves data)*

- **WorkflowRun**: A user-initiated request context that tracks the lifecycle of a multi-step spec-kit process across multiple explicit command executions.
- **CommandExecution**: One user-triggered command run, including the selected command, prerequisite results, participating agents, outputs, and completion status.
- **StageExecution**: A single agent-owned stage activity within a command run, with status, input references, output references, and timing data.
- **AgentProfile**: The record of an agent's role, allowed stage, operating rules, and preferred model profile.
- **ModelAssignment**: The mapping between an agent profile and its primary or fallback Hugging Face model.
- **CommunicationEnvelope**: A structured handoff record containing the upstream summary, artifact references, status, and routing data shared through the orchestrator.
- **ArtifactDocument**: A versioned local Markdown file created, revised, or approved during the workflow.
- **ReviewDecision**: A checkpoint record describing whether an artifact was approved, revised, or blocked and why.
- **OutputBundle**: The set of approved Markdown artifacts produced by one command execution.
- **ArtifactVersion**: A traceable record of prior file states preserved when a command overwrites an existing local artifact.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of valid command submissions complete with the expected Markdown artifacts for that selected command without manual stage triggering inside the command.
- **SC-002**: In standard test scenarios, 95% of successful command runs reach a final reviewed outcome within 5 minutes of user submission.
- **SC-003**: 100% of blocked review decisions stop command completion until a user or rerun resolves the issue.
- **SC-004**: 95% of audited runs let an operator identify the selected command, responsible agents, and model assignments for any artifact in under 1 minute.
- **SC-005**: 100% of successful command runs produce locally accessible Markdown outputs whose file locations are visible in the interface.
- **SC-006**: 100% of commands with missing prerequisites are blocked before agent execution begins and provide a clear next-step message to the user.
- **SC-007**: 100% of rerun commands overwrite the expected target files without creating ambiguous duplicates, while preserving traceable version history.

## Assumptions

- The first release uses a browser-based web interface as the default entry point because it is the lowest-friction option for shared access.
- The product follows the spec-kit interaction model: users explicitly choose each command in sequence instead of triggering all workflow stages from one request.
- Local Markdown artifacts are the primary deliverable for each command and are considered the source package that users review, edit, and hand off to the next selected step.




