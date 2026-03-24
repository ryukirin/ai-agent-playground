# Quickstart: Orchestrated Spec-Kit Command Workflow Platform

## Prerequisites
- Python 3.12+
- Node.js 20+
- MySQL 8.0+
- Access to the target local workspace where Markdown artifacts will be written
- Environment variables for Hugging Face inference access and database connection

## 1. Configure environment
Create backend and frontend environment files with values for:
- MySQL connection string
- Hugging Face API token or model gateway credentials
- Default workspace root
- Artifact backup directory
- Backend API base URL

## 2. Install dependencies
### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## 3. Initialize the database
```bash
cd backend
alembic upgrade head
```

## 4. Start the application
### Backend API
```bash
cd backend
uvicorn src.main:app --reload
```

### Frontend
```bash
cd frontend
npm run dev
```

## 5. Run the first workflow command
1. Open the web interface.
2. Select or create a workflow run for a feature.
3. Choose the `specify` command.
4. Submit the feature request.
5. Wait for the orchestrator and review flow to finish.
6. Open the output summary and verify the generated Markdown file paths.

## 6. Continue to the next command
1. Inspect the generated files in the local workspace.
2. Edit the files manually if needed.
3. Return to the web interface.
4. Choose the next available command, such as `clarify` or `plan`.
5. Confirm that blocked commands stay disabled until prerequisites are satisfied.

## 7. Handle blocked review results
1. Open the command detail view.
2. Read the review rejection reason.
3. Edit the affected local files.
4. Rerun the same command.
5. Confirm that the target file path remains stable and that version history is preserved.

## 8. Verify command-by-command behavior
- Only the selected command should run.
- Future commands should not auto-trigger.
- Commands with missing prerequisites should remain disabled.
- Approved artifacts should be written to local Markdown files.
- Reruns should overwrite target files while preserving version history metadata.
