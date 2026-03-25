#!/usr/bin/env pwsh

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$TaskId,
    [string]$ResultsPath = "specs/001-multi-agent-specflow/github-issues.publish-results.json"
)

$ErrorActionPreference = 'Stop'

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

$repoRoot = git rev-parse --show-toplevel
Import-DotEnvFile -Path (Join-Path $repoRoot '.env.local')

$token = if ($env:GITHUB_TOKEN) { $env:GITHUB_TOKEN } elseif ($env:GH_TOKEN) { $env:GH_TOKEN } else { $null }
if (-not $token) {
    throw 'GITHUB_TOKEN or GH_TOKEN is required.'
}

$resultsFullPath = Join-Path $repoRoot $ResultsPath
if (-not (Test-Path $resultsFullPath -PathType Leaf)) {
    throw "Results file not found: $resultsFullPath"
}

$data = Get-Content $resultsFullPath -Raw | ConvertFrom-Json
$issues = @()
if ($data.created) { $issues += @($data.created) }
if ($data.updated) { $issues += @($data.updated) }
if ($data.skipped) { $issues += @($data.skipped) }
$match = $issues | Where-Object { $_.task_id -eq $TaskId } | Select-Object -First 1
if (-not $match) {
    throw "No issue mapping found for task $TaskId"
}

$repo = $data.repository
$headers = @{
    Accept                 = 'application/vnd.github+json'
    Authorization          = "Bearer $token"
    'X-GitHub-Api-Version' = '2022-11-28'
    'User-Agent'           = 'spec-kit-close-task-issue'
}

$payload = @{ state = 'closed' } | ConvertTo-Json
$uri = "https://api.github.com/repos/$repo/issues/$($match.number)"
$result = Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -Body $payload
Write-Output ("Closed issue #" + $result.number + " for task " + $TaskId)
