#!/usr/bin/env pwsh

[CmdletBinding()]
param(
    [string]$FeatureDir,
    [string]$OutputPath,
    [switch]$Publish
)

$ErrorActionPreference = 'Stop'

. "$PSScriptRoot/common.ps1"

function Import-DotEnvFile {
    param([string]$Path)

    if (-not (Test-Path $Path -PathType Leaf)) {
        return
    }

    foreach ($rawLine in Get-Content $Path) {
        $line = $rawLine.Trim()
        if (-not $line -or $line.StartsWith('#')) {
            continue
        }

        $separatorIndex = $line.IndexOf('=')
        if ($separatorIndex -lt 1) {
            continue
        }

        $name = $line.Substring(0, $separatorIndex).Trim()
        $value = $line.Substring($separatorIndex + 1).Trim()

        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        if (-not (Test-Path "Env:$name") -or [string]::IsNullOrWhiteSpace((Get-Item "Env:$name").Value)) {
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}

function Get-GitHubRepo {
    $remote = git config --get remote.origin.url 2>$null
    if (-not $remote) {
        throw "Git remote origin.url is not configured."
    }

    if ($remote -match 'github\.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+?)(?:\.git)?$') {
        return [PSCustomObject]@{
            Remote = $remote
            Owner  = $matches.owner
            Repo   = $matches.repo
        }
    }

    throw "Remote '$remote' is not a GitHub URL."
}

function Get-PhaseDependencyNote {
    param([string]$Phase)

    switch -Regex ($Phase) {
        '^Phase 1:' { return 'None. This task can start immediately.' }
        '^Phase 2:' { return 'Depends on the Setup phase and blocks all user stories.' }
        '^Phase 3:' { return 'Depends on the Foundational phase and forms the MVP path.' }
        '^Phase 4:' { return 'Depends on User Story 1 because review blocking and reruns build on the command execution flow.' }
        '^Phase 5:' { return 'Depends on User Story 1 and User Story 2 because the timeline and dependency views require execution and review history.' }
        '^Final Phase:' { return 'Starts after all targeted user stories are complete.' }
        default { return 'Follow the ordering and notes in tasks.md.' }
    }
}

function Get-StoryGoal {
    param([string]$Story)

    switch ($Story) {
        'US1' { return 'Let users explicitly choose and run exactly one spec-kit command and receive that command''s Markdown outputs.' }
        'US2' { return 'Add Review Agent governance to each critical step, including blocking, manual correction, and rerun flows.' }
        'US3' { return 'Show operators command history, dependency status, participating agents, and model assignments so they can safely choose the next step.' }
        default { return 'This task supports shared infrastructure or cross-story polish for the overall command workflow platform.' }
    }
}

function Parse-TaskLine {
    param([string]$Line)

    if ($Line -match '^- \[ \] (?<id>T\d{3}) (?<rest>.+)$') {
        $taskId = $matches.id
        $remaining = $matches.rest.Trim()
    } else {
        return $null
    }

    $parallel = $false
    $story = $null

    while ($remaining -match '^\[(?<token>P|US\d+)\]\s*(?<tail>.+)$') {
        $token = $matches.token
        $remaining = $matches.tail.Trim()

        if ($token -eq 'P') {
            $parallel = $true
        } else {
            $story = $token
        }
    }

    $path = $null
    $description = $remaining
    $splitIndex = $remaining.LastIndexOf(' in ')

    if ($splitIndex -gt 0) {
        $description = $remaining.Substring(0, $splitIndex).Trim()
        $path = $remaining.Substring($splitIndex + 4).Trim().Trim('`')
    }

    return [PSCustomObject]@{
        TaskId      = $taskId
        Description = $description
        Parallel    = $parallel
        Story       = $story
        TargetPath  = $path
    }
}

if (-not $FeatureDir) {
    $FeatureDir = (Get-FeaturePathsEnv).FEATURE_DIR
}

$repoRoot = Get-RepoRoot
Import-DotEnvFile -Path (Join-Path $repoRoot '.env.local')

$FeatureDir = (Resolve-Path $FeatureDir).Path
$tasksPath = Join-Path $FeatureDir 'tasks.md'

if (-not (Test-Path $tasksPath -PathType Leaf)) {
    throw "tasks.md not found at '$tasksPath'."
}

$repo = Get-GitHubRepo
$featureName = Split-Path $FeatureDir -Leaf

if (-not $OutputPath) {
    $OutputPath = Join-Path $FeatureDir 'github-issues.json'
}

$lines = Get-Content $tasksPath -Encoding UTF8
$issues = New-Object System.Collections.Generic.List[object]
$currentPhase = ''
$currentPurpose = ''
$currentSection = ''
$order = 0

foreach ($line in $lines) {
    if ($line -match '^## (?<phase>Phase \d+: .+|Final Phase: .+)$') {
        $currentPhase = $matches.phase.Trim()
        $currentPurpose = ''
        $currentSection = ''
        continue
    }

    if ($line -match '^\*\*Purpose\*\*: (?<purpose>.+)$') {
        $currentPurpose = $matches.purpose.Trim()
        continue
    }

    if ($line -match '^### (?<section>.+)$') {
        $currentSection = $matches.section.Trim()
        continue
    }

    $task = Parse-TaskLine -Line $line
    if (-not $task) {
        continue
    }

    $order += 1
    $storyLabel = if ($task.Story) { $task.Story } else { 'Shared' }
    $parallelText = if ($task.Parallel) { 'Yes' } else { 'No' }
    $targetPath = if ($task.TargetPath) { ('`{0}`' -f $task.TargetPath) } else { 'Not explicitly declared' }
    $goal = Get-StoryGoal -Story $task.Story
    $dependencyNote = Get-PhaseDependencyNote -Phase $currentPhase
    $sectionText = if ($currentSection) { $currentSection } else { 'General Tasks' }
    $purposeText = if ($currentPurpose) { $currentPurpose } else { 'See the current phase notes in tasks.md.' }
    $sourcePath = 'specs/' + $featureName + '/tasks.md'

    $bodyLines = @(
        '## Summary',
        $task.Description,
        '',
        '## Context',
        ('- Feature branch: `{0}`' -f $featureName),
        ('- Task ID: `{0}`' -f $task.TaskId),
        ('- Phase: `{0}`' -f $currentPhase),
        ('- Section: `{0}`' -f $sectionText),
        ('- Story: `{0}`' -f $storyLabel),
        ('- Parallelizable: `{0}`' -f $parallelText),
        "- Target path: $targetPath",
        '',
        '## Dependency Notes',
        '- This issue was exported in dependency order from `tasks.md`.',
        "- Phase prerequisite: $dependencyNote",
        "- Phase purpose: $purposeText",
        "- Goal alignment: $goal",
        '',
        '## Completion Checklist',
        "- [ ] Complete $($task.Description)",
        '- [ ] Keep the change aligned with `spec.md`, `plan.md`, and `tasks.md`',
        '- [ ] Add or update tests and validation steps where needed',
        '',
        '## Source',
        ('- Task list: `{0}`' -f $sourcePath)
    )

    $issues.Add([PSCustomObject]@{
        order       = $order
        task_id     = $task.TaskId
        title       = "[$featureName] $($task.TaskId) $($task.Description)"
        phase       = $currentPhase
        section     = $sectionText
        story       = $storyLabel
        parallel    = $task.Parallel
        target_path = $task.TargetPath
        body        = ($bodyLines -join [Environment]::NewLine)
    })
}

$output = [PSCustomObject]@{
    feature      = $featureName
    repository   = "$($repo.Owner)/$($repo.Repo)"
    remote       = $repo.Remote
    generated_at = (Get-Date).ToString('s')
    tasks_path   = $tasksPath
    issue_count  = $issues.Count
    issues       = $issues
}

$output | ConvertTo-Json -Depth 6 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Output "Issue manifest written to: $OutputPath"
Write-Output "Issue count: $($issues.Count)"

if (-not $Publish) {
    exit 0
}

$token = if ($env:GITHUB_TOKEN) { $env:GITHUB_TOKEN } elseif ($env:GH_TOKEN) { $env:GH_TOKEN } else { $null }
if (-not $token) {
    throw "Publishing requires GITHUB_TOKEN or GH_TOKEN."
}

$headers = @{
    Accept                 = 'application/vnd.github+json'
    Authorization          = "Bearer $token"
    'X-GitHub-Api-Version' = '2022-11-28'
    'User-Agent'           = 'spec-kit-taskstoissues'
}

$existingIssues = @{}
$page = 1
do {
    $existing = Invoke-RestMethod -Method Get -Uri "https://api.github.com/repos/$($repo.Owner)/$($repo.Repo)/issues?state=all&per_page=100&page=$page" -Headers $headers
    foreach ($issue in $existing) {
        if ($issue.title -and -not $issue.pull_request) {
            $existingIssues[$issue.title] = [PSCustomObject]@{
                number = $issue.number
                url    = $issue.html_url
                body   = $issue.body
            }
        }
    }
    $page += 1
} while ($existing.Count -eq 100)

$created = New-Object System.Collections.Generic.List[object]
$updated = New-Object System.Collections.Generic.List[object]
$skipped = New-Object System.Collections.Generic.List[object]

foreach ($issue in $issues) {
    $payload = @{
        title = $issue.title
        body  = $issue.body
    } | ConvertTo-Json -Depth 3 -Compress

    if ($existingIssues.ContainsKey($issue.title)) {
        $existingIssue = $existingIssues[$issue.title]
        if ($existingIssue.body -eq $issue.body) {
            $skipped.Add([PSCustomObject]@{
                task_id = $issue.task_id
                title   = $issue.title
                url     = $existingIssue.url
            })
            continue
        }

        $updatedIssue = Invoke-RestMethod `
            -Method Patch `
            -Uri "https://api.github.com/repos/$($repo.Owner)/$($repo.Repo)/issues/$($existingIssue.number)" `
            -Headers $headers `
            -ContentType 'application/json; charset=utf-8' `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($payload))
        $updated.Add([PSCustomObject]@{
            task_id = $issue.task_id
            title   = $updatedIssue.title
            number  = $updatedIssue.number
            url     = $updatedIssue.html_url
        })
        continue
    }

    $createdIssue = Invoke-RestMethod `
        -Method Post `
        -Uri "https://api.github.com/repos/$($repo.Owner)/$($repo.Repo)/issues" `
        -Headers $headers `
        -ContentType 'application/json; charset=utf-8' `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($payload))
    $created.Add([PSCustomObject]@{
        task_id = $issue.task_id
        title   = $createdIssue.title
        number  = $createdIssue.number
        url     = $createdIssue.html_url
    })
}

$resultPath = [System.IO.Path]::ChangeExtension($OutputPath, '.publish-results.json')
[PSCustomObject]@{
    repository = "$($repo.Owner)/$($repo.Repo)"
    created    = $created
    updated    = $updated
    skipped    = $skipped
} | ConvertTo-Json -Depth 5 | Set-Content -Path $resultPath -Encoding UTF8

Write-Output "Created issues: $($created.Count)"
Write-Output "Updated existing issues: $($updated.Count)"
Write-Output "Skipped existing issues: $($skipped.Count)"
Write-Output "Publish results written to: $resultPath"
