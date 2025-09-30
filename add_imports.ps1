# Скрипт для добавления импорта config в файлы
$files = @(
    "frontend/src/app/reports/city/page.tsx",
    "frontend/src/app/reports/masters/page.tsx", 
    "frontend/src/app/admin/page.tsx",
    "frontend/src/app/admin/directors/page.tsx",
    "frontend/src/app/admin/orders/page.tsx",
    "frontend/src/app/admin/statistics/page.tsx",
    "frontend/src/app/masters/[id]/history/page.tsx",
    "frontend/src/components/forms/income-form.tsx",
    "frontend/src/components/forms/expense-form.tsx",
    "frontend/src/components/modals/master-edit-modal.tsx",
    "frontend/src/components/modals/order-edit-modal.tsx",
    "frontend/src/components/modals/order-view-modal.tsx",
    "frontend/src/components/modals/master-view-modal.tsx",
    "frontend/src/components/modals/director-add-modal.tsx",
    "frontend/src/components/modals/director-edit-modal.tsx",
    "frontend/src/components/modals/director-delete-modal.tsx",
    "frontend/src/components/tables/masters-table.tsx",
    "frontend/src/components/tables/cash-history-table.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match '\$\{config\.apiUrl\}' -and $content -notmatch 'import.*config') {
            # Найти последний import и добавить config после него
            $lines = $content -split "`n"
            $lastImportIndex = -1
            for ($i = 0; $i -lt $lines.Length; $i++) {
                if ($lines[$i] -match '^import\s+') {
                    $lastImportIndex = $i
                }
            }
            
            if ($lastImportIndex -ge 0) {
                $lines = $lines[0..$lastImportIndex] + "import { config } from `"@/lib/config`"" + $lines[($lastImportIndex + 1)..($lines.Length - 1)]
                $newContent = $lines -join "`n"
                Set-Content $file $newContent -NoNewline
                Write-Host "Added import to $file"
            }
        }
    }
}
