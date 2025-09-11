# PowerShell script to update all imports from @/lib/db to @/lib/prisma
$files = Get-ChildItem -Path . -Include *.ts,*.tsx -Recurse | Select-String -Pattern "from '@/lib/db'" -List | Select-Object -ExpandProperty Path

foreach ($file in $files) {
    Write-Host "Updating: $file"
    (Get-Content $file) -replace "from '@/lib/db'", "from '@/lib/prisma'" | Set-Content $file
}

Write-Host "✅ Updated $($files.Count) files"