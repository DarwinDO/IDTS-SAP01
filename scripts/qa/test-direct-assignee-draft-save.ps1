param(
    [string]$BaseUrl = "http://localhost:4022/odata/v4/bug",
    [string]$User = "NhanT",
    [string]$BugId = "",
    [string]$AssigneeId = "20000000-0000-0000-0000-000000000002",
    [string]$AssigneeUserId = "10000000-0000-0000-0000-000000000003",
    [string]$SecondAssigneeId = "20000000-0000-0000-0000-000000000001",
    [string]$SecondAssigneeUserId = "10000000-0000-0000-0000-000000000002",
    [string]$SecondDefectCategoryId = "50000000-0000-0000-0000-000000000002"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Net.Http

function New-BasicAuthValue([string]$Username) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes("${Username}:")
    return "Basic " + [Convert]::ToBase64String($bytes)
}

function New-HttpClient([string]$Username) {
    $client = [System.Net.Http.HttpClient]::new()
    $client.Timeout = [TimeSpan]::FromSeconds(30)
    $client.DefaultRequestHeaders.Authorization =
        [System.Net.Http.Headers.AuthenticationHeaderValue]::Parse((New-BasicAuthValue $Username))
    return $client
}

function Invoke-JsonRequest {
    param(
        [System.Net.Http.HttpClient]$Client,
        [string]$Method,
        [string]$Url,
        [object]$Body = $null
    )

    $request = [System.Net.Http.HttpRequestMessage]::new(
        [System.Net.Http.HttpMethod]::new($Method.ToUpperInvariant()),
        $Url
    )
    $request.Headers.Accept.Add(
        [System.Net.Http.Headers.MediaTypeWithQualityHeaderValue]::new("application/json")
    )

    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 10 -Compress
        $request.Content = [System.Net.Http.StringContent]::new(
            $json,
            [System.Text.Encoding]::UTF8,
            "application/json"
        )
    }

    $response = $Client.SendAsync($request).GetAwaiter().GetResult()
    $text = if ($null -ne $response.Content) {
        $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    } else {
        ""
    }
    $json = if ($text) {
        try {
            $text | ConvertFrom-Json
        } catch {
            $null
        }
    } else {
        $null
    }

    return [pscustomobject]@{
        Response = $response
        Text     = $text
        Json     = $json
    }
}

function Assert-Success {
    param(
        [object]$Result,
        [string]$Label
    )

    if (-not $Result.Response.IsSuccessStatusCode) {
        throw "$Label failed. HTTP $([int]$Result.Response.StatusCode)`n$($Result.Text)"
    }
}

function Assert-Equal {
    param(
        [object]$Actual,
        [object]$Expected,
        [string]$Label
    )

    if ($Actual -ne $Expected) {
        throw "$Label failed. Expected '$Expected', received '$Actual'."
    }

    Write-Host "  PASS  $Label = $Expected"
}

function Read-FilteredRows {
    param(
        [System.Net.Http.HttpClient]$Client,
        [string]$Entity,
        [string]$Filter
    )

    $encodedFilter = [Uri]::EscapeDataString($Filter)
    $result = Invoke-JsonRequest `
        -Client $Client `
        -Method "Get" `
        -Url "$BaseUrl/${Entity}?`$filter=$encodedFilter&`$orderby=createdAt desc"
    Assert-Success -Result $result -Label "Read $Entity"
    return @($result.Json.value)
}

$client = New-HttpClient $User
$developerClient = New-HttpClient "DatDT"

try {
    Write-Host ""
    Write-Host "=============================================="
    Write-Host " Direct Assignee Draft Save Regression"
    Write-Host " $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "=============================================="

    $runId = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $createdNewBug = $false
    if ([string]::IsNullOrWhiteSpace($BugId)) {
        $BugId = [guid]::NewGuid().ToString()
        $createBug = Invoke-JsonRequest `
            -Client $client `
            -Method "Post" `
            -Url "$BaseUrl/Bugs" `
            -Body @{
                ID                      = $BugId
                title                   = "QA direct assignee draft save $runId"
                description             = "Regression fixture for direct Assignee draft save."
                priority_code           = "HIGH"
                severity_code           = "MAJOR"
                environment_code        = "QAS"
                environmentDetail       = "Local CAP SQLite QA"
                stepsToReproduce        = "Create a draft and select Assignee through the Object Page field."
                actualResult            = "Selected developer should survive draft activation."
                expectedResult          = "Active bug keeps assignee, status, next processor, history, and notification."
                applicationComponent_ID = "40000000-0000-0000-0000-000000000001"
                defectCategory_ID       = "50000000-0000-0000-0000-000000000001"
            }
        Assert-Success -Result $createBug -Label "Create QA bug"
        Write-Host "  PASS  QA bug created = $BugId"
        $createdNewBug = $true

        if ($createBug.Json.IsActiveEntity -eq $false) {
            $activateCreatedBug = Invoke-JsonRequest `
                -Client $client `
                -Method "Post" `
                -Url "$BaseUrl/Bugs(ID=$BugId,IsActiveEntity=false)/BugService.draftActivate"
            Assert-Success -Result $activateCreatedBug -Label "Activate QA bug"
            Write-Host "  PASS  QA bug activated"
        }
    }

    if ($createdNewBug) {
        Write-Host "  PASS  no previous draft cleanup needed for new QA bug"
    } else {
        $deletePreviousDraft = Invoke-JsonRequest `
            -Client $client `
            -Method "Delete" `
            -Url "$BaseUrl/Bugs(ID=$BugId,IsActiveEntity=false)"
        if ($deletePreviousDraft.Response.IsSuccessStatusCode) {
            Write-Host "  PASS  previous draft deleted"
        } elseif ([int]$deletePreviousDraft.Response.StatusCode -eq 404) {
            Write-Host "  PASS  no existing draft"
        } else {
            Assert-Success -Result $deletePreviousDraft -Label "Delete previous draft"
        }
    }

    $beforeHistory = Read-FilteredRows `
        -Client $client `
        -Entity "HistoryEvents" `
        -Filter "bug_ID eq $BugId"
    $beforeNotifications = Read-FilteredRows `
        -Client $client `
        -Entity "Notifications" `
        -Filter "bug_ID eq $BugId"

    $draftEdit = Invoke-JsonRequest `
        -Client $client `
        -Method "Post" `
        -Url "$BaseUrl/Bugs(ID=$BugId,IsActiveEntity=true)/BugService.draftEdit" `
        -Body @{ PreserveChanges = $true }
    Assert-Success -Result $draftEdit -Label "draftEdit"

    $draftId = $draftEdit.Json.ID
    if (-not $draftId) {
        throw "draftEdit did not return a draft ID."
    }

    $draftPatch = Invoke-JsonRequest `
        -Client $client `
        -Method "Patch" `
        -Url "$BaseUrl/Bugs(ID=$draftId,IsActiveEntity=false)" `
        -Body @{ assignee_ID = $AssigneeId }
    Assert-Success -Result $draftPatch -Label "PATCH draft assignee"

    $draftActivate = Invoke-JsonRequest `
        -Client $client `
        -Method "Post" `
        -Url "$BaseUrl/Bugs(ID=$draftId,IsActiveEntity=false)/BugService.draftActivate"
    Assert-Success -Result $draftActivate -Label "draftActivate"

    $active = Invoke-JsonRequest `
        -Client $client `
        -Method "Get" `
        -Url "$BaseUrl/Bugs(ID=$BugId,IsActiveEntity=true)?`$select=ID,status_code,assignee_ID,nextProcessorUser_ID,nextProcessorRole_code,assigneeFieldControl"
    Assert-Success -Result $active -Label "Read active bug"

    Assert-Equal -Actual $active.Json.assignee_ID -Expected $AssigneeId -Label "Active assignee"
    Assert-Equal -Actual $active.Json.status_code -Expected "ASSIGNED" -Label "Active status"
    Assert-Equal -Actual $active.Json.nextProcessorUser_ID -Expected $AssigneeUserId -Label "Next processor user"
    Assert-Equal -Actual $active.Json.nextProcessorRole_code -Expected "DEVELOPER" -Label "Next processor role"
    Assert-Equal -Actual $active.Json.assigneeFieldControl -Expected 3 -Label "Tester assignee field control"

    $developerView = Invoke-JsonRequest `
        -Client $developerClient `
        -Method "Get" `
        -Url "$BaseUrl/Bugs(ID=$BugId,IsActiveEntity=true)?`$select=ID,assigneeFieldControl"
    Assert-Success -Result $developerView -Label "Read developer field control"
    Assert-Equal `
        -Actual $developerView.Json.assigneeFieldControl `
        -Expected 1 `
        -Label "Developer assignee field control"

    $afterHistory = Read-FilteredRows `
        -Client $client `
        -Entity "HistoryEvents" `
        -Filter "bug_ID eq $BugId"
    $assignmentEvent = $afterHistory |
        Where-Object {
            $_.actionType_code -eq "ASSIGN" -and
            $_.summary -like "*DatDT*"
        } |
        Select-Object -First 1
    if (-not $assignmentEvent -or $afterHistory.Count -le $beforeHistory.Count) {
        throw "Assignment HistoryEvent was not created."
    }
    Write-Host "  PASS  Assignment HistoryEvent created"

    $afterNotifications = Read-FilteredRows `
        -Client $client `
        -Entity "Notifications" `
        -Filter "bug_ID eq $BugId"
    $assignmentNotification = $afterNotifications |
        Where-Object {
            $_.eventType_code -eq "ASSIGNED" -and
            $_.recipient_ID -eq $AssigneeUserId
        } |
        Select-Object -First 1
    if (-not $assignmentNotification -or $afterNotifications.Count -le $beforeNotifications.Count) {
        throw "Assignment notification was not created."
    }
    Write-Host "  PASS  Assignment notification created"

    Write-Host ""
    Write-Host "SC-02 Reassign while status remains ASSIGNED"
    $beforeReassignHistory = $afterHistory
    $beforeReassignNotifications = $afterNotifications

    $reassignDraftEdit = Invoke-JsonRequest `
        -Client $client `
        -Method "Post" `
        -Url "$BaseUrl/Bugs(ID=$BugId,IsActiveEntity=true)/BugService.draftEdit" `
        -Body @{ PreserveChanges = $true }
    Assert-Success -Result $reassignDraftEdit -Label "reassign draftEdit"

    $reassignDraftId = $reassignDraftEdit.Json.ID
    $reassignPatch = Invoke-JsonRequest `
        -Client $client `
        -Method "Patch" `
        -Url "$BaseUrl/Bugs(ID=$reassignDraftId,IsActiveEntity=false)" `
        -Body @{
            assignee_ID       = $SecondAssigneeId
            defectCategory_ID = $SecondDefectCategoryId
        }
    Assert-Success -Result $reassignPatch -Label "PATCH draft reassign"

    $reassignActivate = Invoke-JsonRequest `
        -Client $client `
        -Method "Post" `
        -Url "$BaseUrl/Bugs(ID=$reassignDraftId,IsActiveEntity=false)/BugService.draftActivate"
    Assert-Success -Result $reassignActivate -Label "reassign draftActivate"

    $reassignedActive = Invoke-JsonRequest `
        -Client $client `
        -Method "Get" `
        -Url "$BaseUrl/Bugs(ID=$BugId,IsActiveEntity=true)?`$select=ID,status_code,assignee_ID,nextProcessorUser_ID,nextProcessorRole_code"
    Assert-Success -Result $reassignedActive -Label "Read reassigned active bug"

    Assert-Equal -Actual $reassignedActive.Json.assignee_ID -Expected $SecondAssigneeId -Label "Reassigned assignee"
    Assert-Equal -Actual $reassignedActive.Json.status_code -Expected "ASSIGNED" -Label "Reassigned status"
    Assert-Equal -Actual $reassignedActive.Json.nextProcessorUser_ID -Expected $SecondAssigneeUserId -Label "Reassigned next processor"

    $reassignHistory = Read-FilteredRows `
        -Client $client `
        -Entity "HistoryEvents" `
        -Filter "bug_ID eq $BugId"
    $reassignEvent = $reassignHistory |
        Where-Object {
            $_.actionType_code -eq "REASSIGN" -and
            $_.summary -like "*SangVN*"
        } |
        Select-Object -First 1
    if (-not $reassignEvent -or $reassignHistory.Count -le $beforeReassignHistory.Count) {
        throw "Reassignment HistoryEvent was not created."
    }
    Write-Host "  PASS  Reassignment HistoryEvent created"

    $reassignNotifications = Read-FilteredRows `
        -Client $client `
        -Entity "Notifications" `
        -Filter "bug_ID eq $BugId"
    $reassignNotification = $reassignNotifications |
        Where-Object {
            $_.eventType_code -eq "ASSIGNED" -and
            $_.recipient_ID -eq $SecondAssigneeUserId
        } |
        Select-Object -First 1
    if (-not $reassignNotification -or $reassignNotifications.Count -le $beforeReassignNotifications.Count) {
        throw "Reassignment notification was not created while status remained ASSIGNED."
    }
    Write-Host "  PASS  Reassignment notification created without a status change"

    Write-Host ""
    Write-Host "RESULT: PASS"
} finally {
    $client.Dispose()
    $developerClient.Dispose()
}
