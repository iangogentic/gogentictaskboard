# Fix remaining imports in files with brackets
$files = @(
    "app/api/deliverables/[id]/route.ts",
    "app/api/projects/[id]/archive/route.ts",
    "app/api/projects/[id]/regenerate-token/route.ts",
    "app/api/projects/[id]/route.ts",
    "app/api/time-entries/[id]/route.ts",
    "app/api/users/[id]/route.ts",
    "app/projects/[id]/page.tsx",
    "app/share/[token]/page.tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PWD $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $content = $content -replace "from '@/lib/db'", "from '@/lib/prisma'"
        
        # Add runtime export to API routes if missing
        if ($file -like "*.ts" -and $file -like "*api*" -and $content -notmatch "export const runtime") {
            $content = $content -replace "(import[^`n]*`n)+", "`$0`nexport const runtime = 'nodejs'`n"
        }
        
        Set-Content $fullPath $content -NoNewline
        Write-Host "✅ Fixed: $file"
    } else {
        Write-Host "❌ Not found: $file"
    }
}

Write-Host "`n✨ All imports fixed!"