# Add runtime export to all API route files
$apiFiles = @(
    "app/api/deliverables/route.ts",
    "app/api/my-work/route.ts",
    "app/api/tasks/route.ts",
    "app/api/tasks/bulk/route.ts",
    "app/api/time-entries/route.ts",
    "app/api/updates/route.ts",
    "app/api/users/route.ts"
)

foreach ($file in $apiFiles) {
    $fullPath = Join-Path $PWD $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        if ($content -notmatch "export const runtime") {
            # Add runtime export after imports
            $content = $content -replace "(import[^`n]*`n)+", "`$0`nexport const runtime = 'nodejs'`n"
            Set-Content $fullPath $content -NoNewline
            Write-Host "✅ Added runtime to: $file"
        } else {
            Write-Host "⏭️  Runtime already exists in: $file"
        }
    }
}

Write-Host "`n✨ Runtime exports added to all API routes"