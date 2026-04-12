# Script to sync manifest.json with actual files in each web template pack

$packsPath = "d:\QAStarter\server\templates\packs"
$webPacks = Get-ChildItem -Path $packsPath -Directory -Filter "web-*"

foreach ($pack in $webPacks) {
    $manifestPath = Join-Path $pack.FullName "manifest.json"
    $filesPath = Join-Path $pack.FullName "files"
    
    if (!(Test-Path $manifestPath) -or !(Test-Path $filesPath)) {
        Write-Host "Skipping $($pack.Name) - missing manifest or files folder"
        continue
    }
    
    # Load manifest
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    
    # Get current manifest file paths
    $manifestPaths = $manifest.files | ForEach-Object { $_.path }
    
    # Get actual .hbs files
    $actualFiles = Get-ChildItem -Path $filesPath -Recurse -Filter "*.hbs" | ForEach-Object {
        $relativePath = $_.FullName.Replace("$filesPath\", "").Replace("\", "/").Replace(".hbs", "")
        $relativePath
    }
    
    # Find missing files
    $missing = $actualFiles | Where-Object { $_ -notin $manifestPaths }
    
    if ($missing.Count -gt 0) {
        Write-Host "`n=== $($pack.Name) ===" -ForegroundColor Cyan
        Write-Host "Missing $($missing.Count) files:" -ForegroundColor Yellow
        
        # Generate JSON entries for missing files
        foreach ($file in $missing) {
            $isTemplate = $true
            if ($file -match "\.gitignore$|gradlew$|gradlew\.bat$") {
                $isTemplate = $false
            }
            
            # Determine if file should be conditional
            $conditional = $null
            if ($file -match "Jenkinsfile") { $conditional = @{cicdTool = "jenkins"} }
            elseif ($file -match "\.github") { $conditional = @{cicdTool = "github-actions"} }
            elseif ($file -match "\.gitlab-ci") { $conditional = @{cicdTool = "gitlab-ci"} }
            elseif ($file -match "azure-pipelines") { $conditional = @{cicdTool = "azure-devops"} }
            elseif ($file -match "\.circleci") { $conditional = @{cicdTool = "circleci"} }
            elseif ($file -match "Dockerfile") { $conditional = @{"utilities.includeDocker" = $true} }
            elseif ($file -match "docker-compose") { $conditional = @{"utilities.includeDockerCompose" = $true} }
            elseif ($file -match "ExtentManager|extent-config") { $conditional = @{reportingTool = "extent-reports"} }
            elseif ($file -match "AllureManager|allure\.properties") { $conditional = @{reportingTool = "allure"} }
            elseif ($file -match "features/|step.*defs|stepdefinitions|runners/.*Runner|Hooks") { $conditional = @{testingPattern = "bdd"} }
            
            $entry = @{
                path = $file
                isTemplate = $isTemplate
            }
            
            if ($conditional) {
                $entry.conditional = $conditional
            }
            
            Write-Host "  $file" -ForegroundColor Green
        }
    } else {
        Write-Host "$($pack.Name): OK" -ForegroundColor Green
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Script completed. Review above and add missing entries to manifests."
