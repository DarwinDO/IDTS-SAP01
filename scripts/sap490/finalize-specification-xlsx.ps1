param(
    [Parameter(Mandatory = $false)]
    [string]$GeneratedDirectory = "docs/sap490/generated"
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$outputDirectory = if ([System.IO.Path]::IsPathRooted($GeneratedDirectory)) {
    $GeneratedDirectory
} else {
    Join-Path $root $GeneratedDirectory
}

$workbookNames = @(
    "Functional_Specification_IDTS_SAP01_en_v0.6.xlsx",
    "Functional_Specification_IDTS_SAP01_vi_v0.6.xlsx",
    "Technical_Specification_IDTS_SAP01_en_v0.5.xlsx",
    "Technical_Specification_IDTS_SAP01_vi_v0.5.xlsx",
    "Configuration_Note_IDTS_SAP01_en_v0.5.xlsx",
    "Configuration_Note_IDTS_SAP01_vi_v0.5.xlsx"
)

$templateByPrefix = @{
    "Functional_Specification_" = "Functional_Specification.xlsx"
    "Technical_Specification_" = "Technical_Specification.xlsx"
    "Configuration_Note_" = "Configuration_Note.xlsx"
}

$missing = $workbookNames |
    ForEach-Object { Join-Path $outputDirectory $_ } |
    Where-Object { -not (Test-Path -LiteralPath $_) }

if ($missing) {
    throw "Generated workbook is missing: $($missing -join ', ')"
}

# openpyxl preserves workbook content and most template formatting, but its
# serialized font/drawing child order is rejected by strict OpenXML validators.
# A single native Excel save normalizes the package without rebuilding sheets
# or inventing a new visual style.
$excel = $null
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false

    foreach ($name in $workbookNames) {
        $path = (Resolve-Path -LiteralPath (Join-Path $outputDirectory $name)).Path
        $templateName = $templateByPrefix.GetEnumerator() |
            Where-Object { $name.StartsWith($_.Key) } |
            Select-Object -ExpandProperty Value -First 1
        if (-not $templateName) {
            throw "No official template mapping for $name"
        }
        $templatePath = Join-Path $root "docs\sap490\templates\Deliverable_template\$templateName"
        $workbook = $null
        $templateWorkbook = $null
        try {
            $templateWorkbook = $excel.Workbooks.Open($templatePath, $null, $true)
            $workbook = $excel.Workbooks.Open($path)

            for ($sheetIndex = 1; $sheetIndex -le $templateWorkbook.Worksheets.Count; $sheetIndex++) {
                $templateSheet = $templateWorkbook.Worksheets.Item($sheetIndex)
                $targetSheet = $workbook.Worksheets.Item($templateSheet.Name)
                $sourceSetup = $templateSheet.PageSetup
                $targetSetup = $targetSheet.PageSetup

                # Native Excel may normalize omitted/default XML values during
                # Save. Reapply the official-template print contract explicitly
                # so orientation, printable width and repeated titles stay exact.
                foreach ($property in @(
                    "Orientation", "PaperSize", "Zoom",
                    "FitToPagesWide", "FitToPagesTall",
                    "LeftMargin", "RightMargin", "TopMargin", "BottomMargin",
                    "HeaderMargin", "FooterMargin",
                    "CenterHorizontally", "CenterVertically",
                    "PrintArea", "PrintTitleRows", "PrintTitleColumns",
                    "LeftHeader", "CenterHeader", "RightHeader",
                    "LeftFooter", "CenterFooter", "RightFooter"
                )) {
                    try {
                        $value = $sourceSetup.$property
                        if ($value -is [bool]) {
                            $targetSetup.$property = [bool]$value
                        } elseif ($value -is [int]) {
                            $targetSetup.$property = [int]$value
                        } elseif ($value -is [double]) {
                            $targetSetup.$property = [double]$value
                        } else {
                            $targetSetup.$property = [string]$value
                        }
                    } catch {
                        throw "$name/$($templateSheet.Name): cannot copy PageSetup.$property - $($_.Exception.Message)"
                    }
                }
                # The official template contains an incomplete footer token
                # (`&P / `). Keep the template position/style but complete the
                # page-total field so mentor printouts show `current / total`.
                $targetSetup.RightFooter = '&P / &N'
                [System.Runtime.InteropServices.Marshal]::ReleaseComObject($targetSetup) | Out-Null
                [System.Runtime.InteropServices.Marshal]::ReleaseComObject($sourceSetup) | Out-Null
                [System.Runtime.InteropServices.Marshal]::ReleaseComObject($targetSheet) | Out-Null
                [System.Runtime.InteropServices.Marshal]::ReleaseComObject($templateSheet) | Out-Null
            }

            if ($name.StartsWith("Functional_Specification_")) {
                $screenLayoutSheet = $workbook.Worksheets.Item("Screen Layout")
                try {
                    # The meaningful screen catalog and supplement end at row
                    # 95; styled rows below that created a footer-only page.
                    $screenLayoutSheet.PageSetup.PrintArea = '$B$1:$BG$95'
                    $screenLayoutSheet.PageSetup.Zoom = $false
                    $screenLayoutSheet.PageSetup.FitToPagesWide = 1
                    $screenLayoutSheet.PageSetup.FitToPagesTall = 2
                }
                finally {
                    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($screenLayoutSheet) | Out-Null
                }

                $screenDefinitionSheet = $workbook.Worksheets.Item("Screen Definition")
                try {
                    # The populated IDTS field/action catalog ends before row
                    # 40. Constrain printing to the meaningful template block
                    # instead of emitting an almost-empty continuation page.
                    $screenDefinitionSheet.PageSetup.PrintArea = '$B$1:$AW$40'
                    $screenDefinitionSheet.PageSetup.Zoom = $false
                    $screenDefinitionSheet.PageSetup.FitToPagesWide = 1
                    $screenDefinitionSheet.PageSetup.FitToPagesTall = 1
                }
                finally {
                    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($screenDefinitionSheet) | Out-Null
                }

                $smartFormSheet = $workbook.Worksheets.Item("Smart Form Structure")
                try {
                    # The official sheet remains in place, but its embedded SAP
                    # Smart Form sample belongs to a different project. IDTS uses
                    # the template table to state N/A and must not show that sample.
                    for ($shapeIndex = $smartFormSheet.Shapes.Count; $shapeIndex -ge 1; $shapeIndex--) {
                        $shape = $smartFormSheet.Shapes.Item($shapeIndex)
                        $shape.Delete()
                        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($shape) | Out-Null
                    }
                    # The template has styled rows far below its actual Smart
                    # Form block, which otherwise creates an empty PDF page.
                    # Keep the sheet and its official block, but constrain
                    # printing to the meaningful template area.
                    $smartFormSheet.PageSetup.PrintArea = '$B$1:$AG$57'
                    $smartFormSheet.PageSetup.Zoom = $false
                    $smartFormSheet.PageSetup.FitToPagesWide = 1
                    $smartFormSheet.PageSetup.FitToPagesTall = 1
                }
                finally {
                    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($smartFormSheet) | Out-Null
                }
            }

            $workbook.Save()
        } finally {
            if ($workbook) {
                $workbook.Close($false)
                [System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) | Out-Null
            }
            if ($templateWorkbook) {
                $templateWorkbook.Close($false)
                [System.Runtime.InteropServices.Marshal]::ReleaseComObject($templateWorkbook) | Out-Null
            }
        }
        Write-Output "FINALIZED $name"
    }
} finally {
    if ($excel) {
        $excel.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
