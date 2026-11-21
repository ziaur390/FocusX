[CmdletBinding()]
param(
    [ValidatePattern('^FX-\d{3}$')]
    [string]$Task
)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$rootPrefix = $root.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$manifestPath = Join-Path $root 'harness/tasks.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json

if ($manifest.schemaVersion -ne 1 -or @($manifest.tasks).Count -eq 0) {
    throw 'Expected a version 1 manifest with at least one task.'
}

$tasks = @{}
$statuses = @('pending', 'in_progress', 'blocked', 'verified')
foreach ($entry in $manifest.tasks) {
    $expectedPath = "harness/tasks/$($entry.id).md"
    if ($entry.id -cnotmatch '^FX-\d{3}$' -or [string]::IsNullOrWhiteSpace($entry.title) -or
        $entry.file -cne $expectedPath -or $entry.status -cnotin $statuses -or
        $entry.dependsOn -isnot [array]) {
        throw "Invalid task entry: $($entry.id)"
    }
    if ($tasks.ContainsKey($entry.id)) { throw "Duplicate task ID: $($entry.id)" }
    if (-not (Test-Path -LiteralPath (Join-Path $root $entry.file) -PathType Leaf)) {
        throw "Missing task brief: $($entry.file)"
    }
    $tasks[$entry.id] = $entry
}

$visiting = @{}
$visited = @{}
function Confirm-Dependencies([string]$Id) {
    if ($visiting.ContainsKey($Id)) { throw "Task dependency cycle at $Id" }
    if ($visited.ContainsKey($Id)) { return }

    $visiting[$Id] = $true
    foreach ($dependency in $tasks[$Id].dependsOn) {
        if ($dependency -isnot [string] -or -not $tasks.ContainsKey($dependency)) {
            throw "Unknown dependency for $Id : $dependency"
        }
        Confirm-Dependencies $dependency
    }
    $visiting.Remove($Id)
    $visited[$Id] = $true
}

foreach ($id in $tasks.Keys) { Confirm-Dependencies $id }

$documents = @(
    Get-Item -LiteralPath (Join-Path $root 'START-HERE.md'), (Join-Path $root 'AGENTS.md')
    foreach ($folder in @('docs', 'harness', '.pi/prompts')) {
        Get-ChildItem -LiteralPath (Join-Path $root $folder) -Filter '*.md' -File -Recurse
    }
)

foreach ($document in $documents) {
    $content = Get-Content -LiteralPath $document.FullName -Raw -Encoding UTF8
    foreach ($link in [regex]::Matches($content, '\[[^\]\r\n]+\]\(([^\s()]+)\)')) {
        $target = $link.Groups[1].Value
        if ($target -match '^[a-z][a-z0-9+.-]*:' -or $target.StartsWith('#')) { continue }
        $path = [Uri]::UnescapeDataString(($target -split '#', 2)[0])
        $resolved = [IO.Path]::GetFullPath((Join-Path $document.DirectoryName $path))
        if (-not $resolved.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase) -or
            -not (Test-Path -LiteralPath $resolved)) {
            throw "Broken local link in $($document.Name): $target"
        }
    }
}

if ($Task) {
    if (-not $tasks.ContainsKey($Task)) { throw "Unknown task ID: $Task" }
    $selected = $tasks[$Task]
    $required = @($selected.dependsOn | ForEach-Object { "$_ ($($tasks[$_].status))" })
    if ($required.Count) { Write-Output ("Dependencies: " + ($required -join ', ')) }
    Get-Content -LiteralPath (Join-Path $root $selected.file) -Raw -Encoding UTF8
    exit 0
}

Write-Output "Checked $($tasks.Count) tasks and $($documents.Count) Markdown files."
foreach ($entry in $manifest.tasks) {
    Write-Output ("{0} [{1}] {2}" -f $entry.id, $entry.status, $entry.title)
}
