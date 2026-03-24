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
        '^Phase 1:' { return '无，可立即开始。' }
        '^Phase 2:' { return '依赖 Setup 阶段完成；会阻塞所有用户故事。' }
        '^Phase 3:' { return '依赖 Foundational 阶段完成；这是 MVP 主线。' }
        '^Phase 4:' { return '依赖 User Story 1 完成，因为评审阻断和重跑建立在命令执行流之上。' }
        '^Phase 5:' { return '依赖 User Story 1 和 User Story 2 完成，因为时间线和依赖可视化需要执行记录与评审状态。' }
        '^Final Phase:' { return '依赖所有目标用户故事完成后再进入收尾与打磨。' }
        default { return '以 tasks.md 中的顺序和说明为准。' }
    }
}

function Get-StoryGoal {
    param([string]$Story)

    switch ($Story) {
        'US1' { return '让用户显式选择并只运行一个 spec-kit 命令，并收到该命令的 Markdown 输出。' }
        'US2' { return '在每个关键步骤加入 Review Agent 审核，支持阻断、人工修正和重跑。' }
        'US3' { return '让操作者看见命令历史、依赖状态、参与 Agent 和模型分配，安全决定下一步。' }
        default { return '这是共享基础设施或跨故事收尾工作，服务于整个命令式工作流平台。' }
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

$lines = Get-Content $tasksPath
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
    $parallelText = if ($task.Parallel) { '是' } else { '否' }
    $targetPath = if ($task.TargetPath) { ('`{0}`' -f $task.TargetPath) } else { '未显式声明' }
    $goal = Get-StoryGoal -Story $task.Story
    $dependencyNote = Get-PhaseDependencyNote -Phase $currentPhase
    $sectionText = if ($currentSection) { $currentSection } else { '通用任务' }
    $purposeText = if ($currentPurpose) { $currentPurpose } else { '见 tasks.md 当前阶段说明。' }
    $sourcePath = 'specs/' + $featureName + '/tasks.md'

    $bodyLines = @(
        '## 概要',
        $task.Description,
        '',
        '## 上下文',
        ('- 功能分支: `{0}`' -f $featureName),
        ('- 任务编号: `{0}`' -f $task.TaskId),
        ('- 所属阶段: `{0}`' -f $currentPhase),
        ('- 所属分组: `{0}`' -f $sectionText),
        ('- 用户故事: `{0}`' -f $storyLabel),
        ('- 可并行: `{0}`' -f $parallelText),
        "- 目标路径: $targetPath",
        '',
        '## 依赖说明',
        '- 本 issue 已按 `tasks.md` 中的依赖顺序导出。',
        "- 阶段前置: $dependencyNote",
        "- 阶段目的: $purposeText",
        "- 对应目标: $goal",
        '',
        '## 完成标准',
        "- [ ] 完成 $($task.Description)",
        '- [ ] 变更与 `spec.md`、`plan.md`、`tasks.md` 保持一致',
        '- [ ] 必要时补齐对应测试或验证步骤',
        '',
        '## 来源',
        ('- 任务清单: `{0}`' -f $sourcePath)
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

$existingTitles = @{}
$page = 1
do {
    $existing = Invoke-RestMethod -Method Get -Uri "https://api.github.com/repos/$($repo.Owner)/$($repo.Repo)/issues?state=all&per_page=100&page=$page" -Headers $headers
    foreach ($issue in $existing) {
        if ($issue.title) {
            $existingTitles[$issue.title] = $issue.html_url
        }
    }
    $page += 1
} while ($existing.Count -eq 100)

$created = New-Object System.Collections.Generic.List[object]
$skipped = New-Object System.Collections.Generic.List[object]

foreach ($issue in $issues) {
    if ($existingTitles.ContainsKey($issue.title)) {
        $skipped.Add([PSCustomObject]@{
            task_id = $issue.task_id
            title   = $issue.title
            url     = $existingTitles[$issue.title]
        })
        continue
    }

    $payload = @{
        title = $issue.title
        body  = $issue.body
    } | ConvertTo-Json

    $createdIssue = Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$($repo.Owner)/$($repo.Repo)/issues" -Headers $headers -Body $payload
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
    skipped    = $skipped
} | ConvertTo-Json -Depth 5 | Set-Content -Path $resultPath -Encoding UTF8

Write-Output "Created issues: $($created.Count)"
Write-Output "Skipped existing issues: $($skipped.Count)"
Write-Output "Publish results written to: $resultPath"
