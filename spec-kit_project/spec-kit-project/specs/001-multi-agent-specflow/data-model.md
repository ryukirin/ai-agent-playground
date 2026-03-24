# Data Model: Orchestrated Spec-Kit Command Workflow Platform

## Overview

The system persists command-by-command workflow state in MySQL while writing approved Markdown artifacts to the local workspace. Entities are designed to preserve prerequisite validation, review gates, and artifact lineage across reruns.

## Entities

### WorkflowRun
- Purpose: Represents the end-to-end lifecycle of one feature's multi-command workflow.
- Key fields:
  - `id` (UUID)
  - `feature_key` (string, unique within workspace)
  - `workspace_path` (string)
  - `title` (string)
  - `status` (`draft`, `active`, `blocked`, `completed`, `abandoned`)
  - `current_command` (enum, nullable)
  - `created_at`, `updated_at`
- Validation rules:
  - `workspace_path` must resolve to an allowed local workspace.
  - `feature_key` must map to exactly one feature directory.
- Relationships:
  - One `WorkflowRun` has many `CommandExecution` records.
  - One `WorkflowRun` has many `ArtifactDocument` records.

### CommandExecution
- Purpose: Tracks one user-triggered command such as `specify`, `clarify`, `plan`, `tasks`, `implement`, or `analyze`.
- Key fields:
  - `id` (UUID)
  - `workflow_run_id` (FK)
  - `command_name` (enum)
  - `status` (`queued`, `running`, `review_required`, `blocked`, `completed`, `failed`)
  - `triggered_by` (string)
  - `started_at`, `finished_at`
  - `rerun_of_command_execution_id` (FK, nullable)
  - `prerequisite_snapshot` (JSON)
- Validation rules:
  - `command_name` must be one of the supported commands.
  - A command cannot enter `running` unless prerequisites are satisfied.
- Relationships:
  - One `CommandExecution` has many `StageExecution` records.
  - One `CommandExecution` has many `ReviewDecision` records.
  - One `CommandExecution` produces many `ArtifactDocument` versions.

### StageExecution
- Purpose: Captures one agent-owned execution step within a command run.
- Key fields:
  - `id` (UUID)
  - `command_execution_id` (FK)
  - `agent_profile_id` (FK)
  - `stage_name` (string)
  - `status` (`queued`, `running`, `completed`, `failed`, `blocked`)
  - `input_summary` (text)
  - `output_summary` (text)
  - `started_at`, `finished_at`
- Validation rules:
  - `stage_name` must match the owning agent's allowed role.
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
  - `status` (`draft`, `approved`, `blocked`, `superseded`)
  - `content_hash` (string)
  - `current_version_number` (integer)
  - `last_written_at`
- Validation rules:
  - `absolute_path` must stay inside the selected workspace.
  - `relative_path` must be stable across reruns for the same artifact type.
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
  - `backup_path` (string)
  - `content_hash` (string)
  - `created_at`
- Validation rules:
  - `version_number` must increase monotonically per artifact.
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
- Relationships:
  - Many `ReviewDecision` records belong to one `CommandExecution`.

## State Transitions

### WorkflowRun
- `draft -> active`: first command is triggered.
- `active -> blocked`: a blocking review decision or prerequisite failure halts progress.
- `active -> completed`: all intended commands finish successfully.
- `blocked -> active`: user resolves the issue and reruns the blocked command.
- `active|blocked -> abandoned`: operator intentionally ends the workflow.

### CommandExecution
- `queued -> running`: prerequisites pass and orchestrator dispatches agents.
- `running -> review_required`: command has produced artifacts awaiting review.
- `review_required -> completed`: review passes or revises without blocking.
- `review_required -> blocked`: review rejects the command.
- `running -> failed`: execution error occurs before review.
- `blocked -> running`: same command is rerun after user edits.

### ArtifactDocument
- `draft -> approved`: review or command completion accepts the artifact.
- `draft -> blocked`: review explicitly rejects the artifact.
- `approved -> superseded`: a rerun writes a newer version.

## Relationship Summary
- `WorkflowRun` 1:N `CommandExecution`
- `CommandExecution` 1:N `StageExecution`
- `AgentProfile` 1:N `ModelAssignment`
- `WorkflowRun` 1:N `CommunicationEnvelope`
- `WorkflowRun` 1:N `ArtifactDocument`
- `ArtifactDocument` 1:N `ArtifactVersion`
- `CommandExecution` 1:N `ReviewDecision`
