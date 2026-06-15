# IDTS-6 Happy-Flow Backend Verification Script v2
# NhanT - 2026-06-13
# Fixed: proper CAP OData V4 headers, CSRF token, draft-aware endpoints

$BASE = "http://localhost:4004/odata/v4/bug"
$RESULTS = [System.Collections.Generic.List[hashtable]]::new()

$headers = @{
    "Accept"       = "application/json"
    "Content-Type" = "application/json"
}

function Get-CsrfToken {
    try {
        $r = Invoke-WebRequest -Uri "$BASE/" -Method GET -Headers @{ "x-csrf-token" = "fetch" } -TimeoutSec 15 -ErrorAction Stop
        return $r.Headers["x-csrf-token"]
    } catch { return $null }
}

function Invoke-API {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [string]$Label,
        [int]$ExpectStatus,
        [string]$CsrfToken
    )
    $h = $headers.Clone()
    if ($CsrfToken) { $h["x-csrf-token"] = $CsrfToken }

    try {
        $params = @{ Uri=$Url; Method=$Method; Headers=$h; TimeoutSec=20; ErrorAction="Stop" }
        if ($Body) { $params.Body = $Body }
        $resp = Invoke-WebRequest @params
        $code = [int]$resp.StatusCode
        $json = $null
        try { $json = $resp.Content | ConvertFrom-Json } catch {}
        $pass = ($code -eq $ExpectStatus)
        $statusVal = if ($json -and $json.status_code) { $json.status_code } else { $code }
        return @{ Label=$Label; Pass=$pass; Code=$code; ExpectCode=$ExpectStatus; Status=$statusVal; Json=$json; ErrorMsg="" }
    }
    catch {
        $code = 0
        try { $code = [int]$_.Exception.Response.StatusCode } catch {}
        $errMsg = $_.Exception.Message
        $errJson = $null
        try { $errJson = $_.ErrorDetails.Message | ConvertFrom-Json; if ($errJson.error.message) { $errMsg = $errJson.error.message } } catch {}
        $pass = ($code -eq $ExpectStatus)
        return @{ Label=$Label; Pass=$pass; Code=$code; ExpectCode=$ExpectStatus; Status="HTTP$code"; Json=$errJson; ErrorMsg=$errMsg.Substring(0,[Math]::Min(100,$errMsg.Length)) }
    }
}

function Print-Result([hashtable]$r) {
    $icon = if ($r.Pass) { "PASS" } else { "FAIL" }
    $extra = ""
    if ($r.Status -and $r.Status -ne "HTTP$($r.Code)") { $extra += " status=$($r.Status)" }
    if ($r.ErrorMsg -and -not $r.Pass) { $extra += " ERR: $($r.ErrorMsg)" }
    Write-Host "  $icon  $($r.Label) [HTTP $($r.Code) exp $($r.ExpectCode)]$extra"
    $RESULTS.Add($r)
}

# -----------------------------------------------------------
Write-Host ""
Write-Host "=============================================="
Write-Host " IDTS-6 Happy-Flow Backend Verification v2"
Write-Host " $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "=============================================="

# Warm up server
Write-Host "`nWarming up server..."
try {
    $wu = Invoke-WebRequest -Uri "$BASE/Bugs?`$top=1&`$count=true" -Method GET -Headers $headers -TimeoutSec 30 -ErrorAction Stop
    $wuJson = $wu.Content | ConvertFrom-Json
    Write-Host "  Server OK - Bugs count: $($wuJson.'@odata.count')"
} catch {
    Write-Host "  WARN: $($_.Exception.Message.Substring(0,80))"
}

# Get CSRF token
$csrf = Get-CsrfToken
Write-Host "  CSRF token: $(if ($csrf) { 'obtained' } else { 'not required (dev mode)' })"
Write-Host ""

# Seed data IDs
$BUG1 = "90000000-0000-0000-0000-000000000001"  # NEW
$BUG3 = "90000000-0000-0000-0000-000000000003"  # IN_PROGRESS, assignee=SangVN profile
$DEV_SANG = "20000000-0000-0000-0000-000000000001"  # SangVN DeveloperProfile
$DEV_DAT  = "20000000-0000-0000-0000-000000000002"  # DatDT DeveloperProfile
$COMP_6   = "40000000-0000-0000-0000-000000000006"
$CAT_2    = "50000000-0000-0000-0000-000000000002"
$REPORTER = "10000000-0000-0000-0000-000000000004"  # NhanT (TESTER)

$NEW_BUG_ID = $null

# ----------------------------------------------------------------
# SC-01: Create Bug
# ----------------------------------------------------------------
Write-Host "SC-01: Create Bug (POST /Bugs)"

$bugBody = @{
    title = "QA-IDTS6 Happy Flow Test Bug"
    description = "Created by NhanT for IDTS-6 QA verification run"
    stepsToReproduce = "1. Open bug list  2. Click create  3. Fill form"
    actualResult = "Bug creation form not validated"
    expectedResult = "All required fields validated"
    priority_code = "HIGH"
    severity_code = "MAJOR"
    environment_code = "QAS"
    applicationComponent_ID = $COMP_6
    defectCategory_ID = $CAT_2
    reporter_ID = $REPORTER
} | ConvertTo-Json

$r1a = Invoke-API -Method POST -Url "$BASE/Bugs" -Body $bugBody -Label "SC-01a Create bug all required fields" -ExpectStatus 201 -CsrfToken $csrf
Print-Result $r1a
if ($r1a.Json -and $r1a.Json.ID) {
    $NEW_BUG_ID = $r1a.Json.ID
    Write-Host "         Created: ID=$NEW_BUG_ID | bugNumber=$($r1a.Json.bugNumber) | status=$($r1a.Json.status_code)"
}

$r1b = Invoke-API -Method POST -Url "$BASE/Bugs" -Body (@{
    description="missing title"; stepsToReproduce="x"; actualResult="x"; expectedResult="x"
    priority_code="HIGH"; severity_code="MAJOR"; environment_code="QAS"
    applicationComponent_ID=$COMP_6; defectCategory_ID=$CAT_2; reporter_ID=$REPORTER
} | ConvertTo-Json) -Label "SC-01b Create bug missing title -> 400" -ExpectStatus 400 -CsrfToken $csrf
Print-Result $r1b

Write-Host ""

# ----------------------------------------------------------------
# SC-02: Assign to Developer
# BUG-0001 (NEW) - component=CC1, DatDT has responsibility for CC1
# ----------------------------------------------------------------
Write-Host "SC-02: Assign to Developer"

$r2a = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG1,IsActiveEntity=true)/BugService.assignToDeveloper" `
    -Body (@{ assigneeID=$DEV_DAT; note="Assigned by QA test" } | ConvertTo-Json) `
    -Label "SC-02a Assign BUG-0001 to DatDT" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $r2a

$r2b = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG1,IsActiveEntity=true)/BugService.assignToDeveloper" `
    -Body (@{ note="no assigneeID given" } | ConvertTo-Json) `
    -Label "SC-02b Assign without assigneeID -> 400" -ExpectStatus 400 -CsrfToken $csrf
Print-Result $r2b

Write-Host ""

# ----------------------------------------------------------------
# SC-03: Mark In Review
# ----------------------------------------------------------------
Write-Host "SC-03: Mark In Review"

$r3a = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG1,IsActiveEntity=true)/BugService.markInReview" `
    -Body (@{ note="" } | ConvertTo-Json) `
    -Label "SC-03a markInReview ASSIGNED bug - note optional" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $r3a

Write-Host ""

# ----------------------------------------------------------------
# SC-04: Start Progress
# ----------------------------------------------------------------
Write-Host "SC-04: Start Progress"

$r4a = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG1,IsActiveEntity=true)/BugService.startProgress" `
    -Body (@{ note="Starting QA test progress" } | ConvertTo-Json) `
    -Label "SC-04a startProgress IN_REVIEW bug" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $r4a

Write-Host ""

# ----------------------------------------------------------------
# SC-05: Request More Information
# ----------------------------------------------------------------
Write-Host "SC-05: Request More Information"

$r5a = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG1,IsActiveEntity=true)/BugService.requestMoreInformation" `
    -Body (@{ reason="Need exact error logs and environment details" } | ConvertTo-Json) `
    -Label "SC-05a requestMoreInformation with reason" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $r5a

$r5b = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG1,IsActiveEntity=true)/BugService.requestMoreInformation" `
    -Body (@{ reason="" } | ConvertTo-Json) `
    -Label "SC-05b requestMoreInformation empty reason -> 400" -ExpectStatus 400 -CsrfToken $csrf
Print-Result $r5b

Write-Host ""

# ----------------------------------------------------------------
# SC-06: Reject Bug (use BUG-0003 IN_PROGRESS)
# ----------------------------------------------------------------
Write-Host "SC-06: Reject Bug"

$r6a = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.rejectBug" `
    -Body (@{ reason="Wrong classification - UI defect, not backend" } | ConvertTo-Json) `
    -Label "SC-06a rejectBug with reason" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $r6a

$r6b = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.rejectBug" `
    -Body (@{ reason="" } | ConvertTo-Json) `
    -Label "SC-06b rejectBug empty reason -> 400" -ExpectStatus 400 -CsrfToken $csrf
Print-Result $r6b

Write-Host ""

# ----------------------------------------------------------------
# SC-07: Move to Pending Assignment (from REJECTED)
# ----------------------------------------------------------------
Write-Host "SC-07: Move to Pending Assignment"

$r7a = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.moveToPendingAssignment" `
    -Body (@{ reason="Awaiting reclassification by PM" } | ConvertTo-Json) `
    -Label "SC-07a moveToPendingAssignment after REJECTED" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $r7a

Write-Host ""

# ----------------------------------------------------------------
# SC-08: Resolve Bug [IDTS-3 FIX VERIFICATION]
# BUG3: PENDING -> Assign -> InReview -> InProgress -> Resolve
# ----------------------------------------------------------------
Write-Host "SC-08: Resolve Bug [IDTS-3 FIX VERIFICATION]"

# Re-assign BUG3 to SangVN (responsible for CC-11 which BUG3 uses)
$prep1 = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.assignToDeveloper" `
    -Body (@{ assigneeID=$DEV_SANG; note="Re-assign for resolve test" } | ConvertTo-Json) `
    -Label "SC-08-prep1 Assign BUG3 to SangVN" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $prep1

$prep2 = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.markInReview" `
    -Body (@{ note="" } | ConvertTo-Json) `
    -Label "SC-08-prep2 markInReview BUG3" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $prep2

$prep3 = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.startProgress" `
    -Body (@{ note="" } | ConvertTo-Json) `
    -Label "SC-08-prep3 startProgress BUG3" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $prep3

# 8b first: resolve WITHOUT note -> MUST return 400 (IDTS-3 fix)
$r8b = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.resolveBug" `
    -Body (@{ note="" } | ConvertTo-Json) `
    -Label "SC-08b resolveBug NO note -> 400 [IDTS-3 FIX]" -ExpectStatus 400 -CsrfToken $csrf
Print-Result $r8b

# 8a: resolve WITH note -> must return 200
$r8a = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.resolveBug" `
    -Body (@{ note="Root cause fixed: corrected category mapping" } | ConvertTo-Json) `
    -Label "SC-08a resolveBug WITH note -> 200 [IDTS-3 FIX]" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $r8a

Write-Host ""

# ----------------------------------------------------------------
# SC-09: Send to Retest
# ----------------------------------------------------------------
Write-Host "SC-09: Send to Retest"

$r9a = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.sendToRetest" `
    -Body (@{ note="Please retest in QAS environment" } | ConvertTo-Json) `
    -Label "SC-09a sendToRetest on RESOLVED" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $r9a

Write-Host ""

# ----------------------------------------------------------------
# SC-10: Reopen Bug
# ----------------------------------------------------------------
Write-Host "SC-10: Reopen Bug"

$r10a = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.reopenBug" `
    -Body (@{ reason="Issue still reproducible after fix attempt" } | ConvertTo-Json) `
    -Label "SC-10a reopenBug with reason" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $r10a

$r10b = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.reopenBug" `
    -Body (@{ reason="" } | ConvertTo-Json) `
    -Label "SC-10b reopenBug empty reason -> 400" -ExpectStatus 400 -CsrfToken $csrf
Print-Result $r10b

Write-Host ""

# ----------------------------------------------------------------
# SC-11: Close Bug (path: Assign -> InReview -> Progress -> Resolve -> Close)
# ----------------------------------------------------------------
Write-Host "SC-11: Close Bug"

Invoke-API -Method POST -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.assignToDeveloper" `
    -Body (@{ assigneeID=$DEV_SANG } | ConvertTo-Json) -Label "SC-11-prep1 Assign" -ExpectStatus 200 -CsrfToken $csrf | Out-Null
Invoke-API -Method POST -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.markInReview" `
    -Body (@{ note="" } | ConvertTo-Json) -Label "SC-11-prep2 InReview" -ExpectStatus 200 -CsrfToken $csrf | Out-Null
Invoke-API -Method POST -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.startProgress" `
    -Body (@{ note="" } | ConvertTo-Json) -Label "SC-11-prep3 InProgress" -ExpectStatus 200 -CsrfToken $csrf | Out-Null
Invoke-API -Method POST -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.resolveBug" `
    -Body (@{ note="Fixed for close test" } | ConvertTo-Json) -Label "SC-11-prep4 Resolve" -ExpectStatus 200 -CsrfToken $csrf | Out-Null

$r11a = Invoke-API -Method POST `
    -Url "$BASE/Bugs(ID=$BUG3,IsActiveEntity=true)/BugService.closeBug" `
    -Body (@{ note="QA verified and closed" } | ConvertTo-Json) `
    -Label "SC-11a closeBug on RESOLVED" -ExpectStatus 200 -CsrfToken $csrf
Print-Result $r11a

Write-Host ""

# ----------------------------------------------------------------
# SC-12: History Logs
# ----------------------------------------------------------------
Write-Host "SC-12: History Logs recorded"

$r12 = Invoke-API -Method GET `
    -Url "$BASE/HistoryLogs?`$filter=bug_ID eq $BUG3&`$orderby=createdAt desc&`$top=5" `
    -Label "SC-12a GET HistoryLogs for BUG-0003" -ExpectStatus 200 -CsrfToken $null
$count = if ($r12.Json -and $r12.Json.value) { $r12.Json.value.Count } else { 0 }
$r12.Pass = ($count -gt 0)
$r12.Status = "entries=$count"
Print-Result $r12
if ($r12.Json -and $r12.Json.value) {
    Write-Host "         Sample entries:"
    $r12.Json.value | Select-Object -First 3 | ForEach-Object {
        Write-Host "           $($_.actionType_code) | $($_.fieldName) | $($_.oldValue) -> $($_.newValue)"
    }
}

Write-Host ""

# ----------------------------------------------------------------
# Summary
# ----------------------------------------------------------------
$passed = ($RESULTS | Where-Object { $_.Pass }).Count
$failed = ($RESULTS | Where-Object { -not $_.Pass }).Count
$total  = $RESULTS.Count

Write-Host "=============================================="
Write-Host " TOTAL: $passed PASS  |  $failed FAIL  |  $total tests"
Write-Host "=============================================="
if ($failed -gt 0) {
    Write-Host ""
    Write-Host "FAILED:"
    $RESULTS | Where-Object { -not $_.Pass } | ForEach-Object {
        Write-Host "  FAIL  $($_.Label)"
        Write-Host "        HTTP $($_.Code) expected $($_.ExpectCode)"
        if ($_.ErrorMsg) { Write-Host "        $($_.ErrorMsg)" }
    }
}
