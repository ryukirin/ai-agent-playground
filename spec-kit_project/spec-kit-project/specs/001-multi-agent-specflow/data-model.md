# Data Model: Orchestrated Spec-Kit Command Workflow Platform

## Overview

The system persists command-by-command workflow state in MySQL while writing approved Markdown artifacts to the local workspace. Entities are designed to preserve prerequisite validation, review gates, artifact lineage, source-of-truth reconciliation, and write-finalization recovery across reruns.

## Persistence Classification

- **Persisted records**: `WorkflowRun`, `CommandExecution`, `StageExecution`, `AgentProfile`, `ModelAssignment`, `CommunicationEnvelope`, `ArtifactDocument`, `ArtifactVersion`, and `ReviewDecision`
- **Derived read models**: `OutputBundle`, workflow timeline projections, rollback candidate lists, and operator summary panels
- **Transient state**: in-flight prompts, streaming model output, temporary scratch buffers, and other ephemeral runtime state that is not required for audit or recovery

## Entities

### WorkflowRun
- Purpose: Represents the end-to-end lifecycle of one feature's multi-command workflow.
- Key fields:
  - `id` (UUID)
  - `feature_key` (string, unique per workspace)
  - `workspace_path` (string)
  - `title` (string)
  - `status` (`draft`, `active`, `blocked`, `completed`, `abandoned`)
  - `current_command` (enum, nullable)
  - `current_command_execution_id` (FK, nullable)
  - `created_at`, `updated_at`
- Validation rules:
  - `workspace_path` must resolve to a canonical absolute local path under a configured allowlist of workspace roots.
  - `feature_key` must map to exactly one feature directory inside one workspace.
  - `feature_key` is unique under `(workspace_path, feature_key)`.
  - Reruns and repeated command attempts do not create a new `WorkflowRun`; a brand-new workflow for the same human-readable feature name must receive a new unique `feature_key`.
  - A blocked command remains the workflow's current command until a replacement rerun is accepted or the run is abandoned.
  - Relative paths, non-local URIs, and canonicalized paths that escape an allowed workspace root are rejected.
- Relationships:
  - One `WorkflowRun` has many `CommandExecution` records.
  - One `WorkflowRun` has many `ArtifactDocument` records.
  - One `WorkflowRun` has many `CommunicationEnvelope` records.

### CommandExecution
- Purpose: Tracks one user-triggered command such as `specify`, `clarify`, `plan`, `tasks`, `implement`, or `analyze`.
- Key fields:
  - `id` (UUID)
  - `workflow_run_id` (FK)
  - `command_name` (enum)
  - `status` (`queued`, `running`, `review_required`, `blocked`, `incomplete`, `completed`, `failed`)
  - `artifact_write_status` (`not_started`, `writing`, `succeeded`, `partial`, `failed`)
  - `failure_category` (`none`, `prerequisite_block`, `review_block`, `agent_error`, `write_failure`, `model_unavailable`, `database_unavailable`)
  - `triggered_by` (string)
  - `started_at`, `finished_at`
  - `rerun_of_command_execution_id` (FK, nullable)
  - `prerequisite_snapshot` (JSON)
  - `completion_notes` (text, nullable)
- Validation rules:
  - `command_name` must be one of the supported commands.
  - A command cannot enter `running` unless prerequisites are satisfied.
  - `prerequisite_snapshot` is required for both blocked and accepted command requests so blocked commands still preserve evidence.
  - A rerun always creates a new `CommandExecution` row linked through `rerun_of_command_execution_id`; the prior row is never mutated into a new attempt.
  - `status = completed` requires `artifact_write_status = succeeded` when the command produces reviewable or persisted artifacts.
  - `status = incomplete` is used when review has passed or revisions have been accepted but artifact writing, backup creation, or write-finalization metadata did not fully succeed.
- Relationships:
  - One `CommandExecution` has many `StageExecution` records.
  - One `CommandExecution` has many `ReviewDecision` records.
  - One `CommandExecution` produces many `ArtifactDocument` updates and one derived `OutputBundle`.

### StageExecution
- Purpose: Captures one agent-owned execution step within a command run.
- Key fields:
  - `id` (UUID)
  - `command_execution_id` (FK)
  - `agent_profile_id` (FK)
  - `stage_name` (string)
  - `status` (`queued`, `running`, `completed`, `failed`, `blocked`)
  - `failure_category` (`none`, `model_unavailable`, `validation_error`, `runtime_error`, `upstream_block`)
  - `input_summary` (text)
  - `output_summary` (text)
  - `started_at`, `finished_at`
- Validation rules:
  - `stage_name` must match the owning agent's allowed role.
  - `failure_category = model_unavailable` is used only when both the preferred model and any configured fallback cannot serve the request.
- Relationships:
  - Many `StageExecution` records belong to one `CommandExecution`.

### AgentProfile
- Purpose: Defines the behavior and boundaries of each platform agent.
- Key fields:
  - `id` (UUID)
  - `agent_name` (string, unique)
  - `role_type` (`orchestrator`, `stage`, `review`)
  - `owned_commands` (JSON array)
  - `can_edit_artifacts` (boolean)
  - `is_active` (boolean)
- Validation rules:
  - Only the review agent may block command completion.
- Relationships:
  - One `AgentProfile` has many `ModelAssignment` records.
  - One `AgentProfile` has many `StageExecution` records.

### ModelAssignment
- Purpose: Maps an agent profile to its primary and fallback Hugging Face models.
- Key fields:
  - `id` (UUID)
  - `agent_profile_id` (FK)
  - `primary_model_slug` (string)
  - `fallback_model_slug` (string, nullable)
  - `selection_rationale` (text)
  - `is_current` (boolean)
- Validation rules:
  - `primary_model_slug` must be a public Hugging Face model identifier.
  - Fallback changes and fallback failures must remain queryable from workflow history.
- Relationships:
  - Many `ModelAssignment` records belong to one `AgentProfile`.

### CommunicationEnvelope
- Purpose: Preserves structured handoffs between agents through the orchestrator.
- Key fields:
  - `id` (UUID)
  - `workflow_run_id` (FK)
  - `command_execution_id` (FK)
  - `source_agent` (string)
  - `target_agent` (string)
  - `artifact_refs` (JSON array)
  - `context_summary` (text)
  - `delivery_status` (`pending`, `delivered`, `consumed`, `failed`)
  - `created_at`
- Validation rules:
  - Each envelope must include at least one artifact reference or context summary.
  - Envelopes persist canonical handoff metadata and summaries; raw secrets, tokens, and credential material are excluded from persisted history.
- Relationships:
  - Many `CommunicationEnvelope` records belong to one `WorkflowRun`.

### ArtifactDocument
- Purpose: Represents the current state of a local Markdown artifact managed by the workflow.
- Key fields:
  - `id` (UUID)
  - `workflow_run_id` (FK)
  - `command_execution_id` (FK)
  - `artifact_type` (string)
  - `relative_path` (string)
  - `absolute_path` (string)
  - `status` (`draft`, `approved`, `blocked`, `superseded`, `write_failed`)
  - `source_of_truth` (`database`, `local_file`)
  - `content_hash` (string)
  - `current_version_number` (integer)
  - `last_local_file_mtime` (datetime, nullable)
  - `last_user_edit_detected_at` (datetime, nullable)
  - `last_written_at` (datetime, nullable)
  - `last_write_error` (text, nullable)
- Validation rules:
  - `absolute_path` must stay inside the selected workspace after canonicalization.
  - `relative_path` must be stable across reruns for the same artifact type.
  - Symlink, junction, or traversal resolution must not allow the effective artifact location to escape the selected workspace.
  - Source-of-truth reconciliation uses content hash first and timestamp second.
  - `status = write_failed` means the approved artifact payload exists in persisted state but the local file, backup, or finalization metadata does not yet fully match the approved version.
- Relationships:
  - One `ArtifactDocument` has many `ArtifactVersion` records.
  - One `ArtifactDocument` may be referenced by many `ReviewDecision` records.

### ArtifactVersion
- Purpose: Tracks historical file states when an artifact is overwritten on rerun.
- Key fields:
  - `id` (UUID)
  - `artifact_document_id` (FK)
  - `version_number` (integer)
  - `created_by_command_execution_id` (FK)
  - `backup_path` (string, nullable)
  - `backup_status` (`pending`, `stored`, `missing`, `failed`)
  - `backup_error` (text, nullable)
  - `content_hash` (string)
  - `created_at`
- Validation rules:
  - `version_number` must increase monotonically per artifact.
  - `backup_status = missing` or `failed` keeps the parent command in an incomplete recovery state until finalization succeeds or the operator resolves the inconsistency.
- Relationships:
  - Many `ArtifactVersion` records belong to one `ArtifactDocument`.

### ReviewDecision
- Purpose: Records review outcomes for important artifacts during command execution.
- Key fields:
  - `id` (UUID)
  - `command_execution_id` (FK)
  - `artifact_document_id` (FK)
  - `review_agent_profile_id` (FK)
  - `decision` (`approved`, `revised`, `blocked`)
  - `reason` (text)
  - `blocking` (boolean)
  - `created_at`
- Validation rules:
  - `reason` is mandatory when `decision = blocked`.
  - Important artifacts include `spec.md`, `plan.md`, `tasks.md`, prerequisite artifacts for later commands, and implementation artifacts that change code, contracts, schema, migrations, or operator-facing configuration.
- Relationships:
  - Many `ReviewDecision` records belong to one `CommandExecution`.

### OutputBundle
- Purpose: Represents the operator-facing result of one command execution without duplicating persisted artifact rows.
- Representation:
  - Derived from one `CommandExecution`, its current `ArtifactDocument` set, related `ReviewDecision` rows, and `artifact_write_status`
  - Exposed through API and UI views as the approved artifact list plus finalization state
- Validation rules:
  - `OutputBundle` is not stored as an independent table.
  - A bundle is considered complete only when the underlying command is `completed` and `artifact_write_status = succeeded`.

## State Transitions

### WorkflowRun
- `draft -> active`: first command is triggered.
- `active -> blocked`: a blocking review decision or prerequisite block halts the current command.
- `active -> active`: a command finishes, fails, or becomes incomplete but the workflow remains recoverable.
- `blocked -> active`: user resolves the issue and a replacement rerun or newly valid command is accepted.
- `active -> completed`: all intended commands finish successfully and their artifact writes are finalized.
- `active|blocked -> abandoned`: operator intentionally ends the workflow.

### CommandExecution
- `queued -> blocked`: prerequisite validation fails before agent dispatch, but the command record and prerequisite evidence are still persisted.
- `queued -> running`: prerequisites pass and orchestrator dispatches agents.
- `running -> review_required`: command has produced artifacts awaiting review.
- `review_required -> completed`: review passes or revises without blocking and all artifact writes finalize successfully.
- `review_required -> incomplete`: review passes or revises, but artifact writing, backup creation, or finalization metadata is only partially successful.
- `review_required -> blocked`: review rejects the command.
- `running|review_required -> failed`: execution error occurs before a recoverable write-finalization path is reached.
- `blocked|failed|incomplete`: terminal audit states for that attempt; recovery creates a new queued `CommandExecution` linked through `rerun_of_command_execution_id`.

### ArtifactDocument
- `draft -> approved`: review or command completion accepts the artifact and local write finalization succeeds.
- `draft -> blocked`: review explicitly rejects the artifact.
- `approved -> superseded`: a rerun writes a newer version to the same stable artifact path.
- `draft|approved -> write_failed`: approved content exists in persisted workflow state, but the local file, backup, or version metadata needs recovery.
- `write_failed -> approved`: write retry and metadata reconciliation succeed.

## Relationship Summary
- `WorkflowRun` 1:N `CommandExecution`
- `CommandExecution` 1:N `StageExecution`
- `AgentProfile` 1:N `ModelAssignment`
- `WorkflowRun` 1:N `CommunicationEnvelope`
- `WorkflowRun` 1:N `ArtifactDocument`
- `ArtifactDocument` 1:N `ArtifactVersion`
- `CommandExecution` 1:N `ReviewDecision`
- `CommandExecution` 1:1 derived `OutputBundle`

## Indexing And Query Obligations

- Unique index on `(workspace_path, feature_key)` for `WorkflowRun`
- Index on `(workflow_run_id, status, created_at)` for `CommandExecution`
- Index on `(command_execution_id, stage_name)` for `StageExecution`
- Index on `(workflow_run_id, relative_path)` for `ArtifactDocument`
- Index on `(artifact_document_id, version_number)` for `ArtifactVersion`
- Index on `(command_execution_id, created_at)` for `ReviewDecision`
- Index on `(workflow_run_id, command_execution_id, created_at)` for `CommunicationEnvelope`
- These indexes must support command-availability checks under 2 seconds, prerequisite validation under 1 second, and artifact audit lookups under 1 minute at the expected scale of dozens of runs per day and hundreds of artifact revisions per workspace.

## Durability, Privacy, And Recovery Rules

- MySQL is the durable system of record for command acceptance, prerequisite evidence, review outcomes, artifact metadata, and pending write-finalization state.
- The system must persist command acceptance and pending artifact-write intent before dispatching agents or considering file writes complete.
- If MySQL is unavailable, the orchestrator must not start new command execution or finalization work.
- If Hugging Face model access fails and no fallback is available, the affected `StageExecution` and parent `CommandExecution` record that dependency failure explicitly.
- Communication envelopes store summaries and artifact references only; secrets, tokens, and raw credential values are excluded from persisted history.
- Superseded artifact backups are retained for at least 30 days after supersession or run abandonment unless the operator explicitly deletes the workflow data.

