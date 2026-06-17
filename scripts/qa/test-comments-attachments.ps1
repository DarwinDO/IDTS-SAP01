param(
    [string]$BaseUrl = "http://localhost:4004/odata/v4/bug",
    [string]$User = "NhanT",
    [string]$BugId = "90000000-0000-0000-0000-000000000001"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Net.Http

function New-BasicAuthValue([string]$Username) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes("${Username}:")
    return "Basic " + [Convert]::ToBase64String($bytes)
}

function New-HttpClient([string]$Username) {
    $handler = [System.Net.Http.HttpClientHandler]::new()
    $client = [System.Net.Http.HttpClient]::new($handler)
    $client.Timeout = [TimeSpan]::FromSeconds(30)
    $client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::Parse((New-BasicAuthValue $Username))
    return $client
}

function Read-ResponseBody([System.Net.Http.HttpResponseMessage]$Response) {
    if ($null -eq $Response.Content) {
        return ""
    }
    return $Response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
}

function Assert-SuccessResponse {
    param(
        [System.Net.Http.HttpResponseMessage]$Response,
        [string]$Label
    )

    if (-not $Response.IsSuccessStatusCode) {
        $body = Read-ResponseBody $Response
        throw "$Label failed. HTTP $([int]$Response.StatusCode) $($Response.ReasonPhrase)`n$body"
    }
}

function Invoke-JsonRequest {
    param(
        [System.Net.Http.HttpClient]$Client,
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$ExtraHeaders = $null
    )

    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::$Method, $Url)
    $request.Headers.Accept.Add([System.Net.Http.Headers.MediaTypeWithQualityHeaderValue]::new("application/json"))
    if ($null -ne $ExtraHeaders) {
        foreach ($key in $ExtraHeaders.Keys) {
            $request.Headers.TryAddWithoutValidation($key, [string]$ExtraHeaders[$key]) | Out-Null
        }
    }

    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 10 -Compress
        $request.Content = [System.Net.Http.StringContent]::new($json, [System.Text.Encoding]::UTF8, "application/json")
    }

    $response = $Client.SendAsync($request).GetAwaiter().GetResult()
    $text = Read-ResponseBody $response
    $json = $null
    if ($text) {
        try {
            $json = $text | ConvertFrom-Json
        } catch {
            $json = $null
        }
    }

    return [pscustomobject]@{
        Response = $response
        Text     = $text
        Json     = $json
    }
}

function Invoke-BinaryPut {
    param(
        [System.Net.Http.HttpClient]$Client,
        [string]$Url,
        [byte[]]$Bytes,
        [string]$ContentType,
        [string]$FileName
    )

    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Put, $Url)
    $request.Content = [System.Net.Http.ByteArrayContent]::new($Bytes)
    $request.Content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse($ContentType)
    $request.Content.Headers.ContentDisposition = [System.Net.Http.Headers.ContentDispositionHeaderValue]::new("attachment")
    $request.Content.Headers.ContentDisposition.FileName = $FileName
    $response = $Client.SendAsync($request).GetAwaiter().GetResult()

    return [pscustomobject]@{
        Response = $response
        Text     = Read-ResponseBody $response
    }
}

function Invoke-BinaryGet {
    param(
        [System.Net.Http.HttpClient]$Client,
        [string]$Url
    )

    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $Url)
    $request.Headers.Accept.Add([System.Net.Http.Headers.MediaTypeWithQualityHeaderValue]::Parse("*/*"))
    $response = $Client.SendAsync($request).GetAwaiter().GetResult()
    $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    return [pscustomobject]@{
        Response = $response
        Bytes    = $bytes
    }
}

function Wait-Until {
    param(
        [scriptblock]$Check,
        [string]$Label,
        [int]$Attempts = 5,
        [int]$DelayMilliseconds = 400
    )

    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        $value = & $Check
        if ($null -ne $value) {
            return $value
        }

        if ($attempt -lt $Attempts) {
            Start-Sleep -Milliseconds $DelayMilliseconds
        }
    }

    throw "$Label not found after $Attempts attempts."
}

$client = New-HttpClient $User

try {
    Write-Host ""
    Write-Host "=============================================="
    Write-Host " IDTS Comments + Attachments HTTP QA"
    Write-Host " $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "=============================================="

    $runId = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $commentText = "QA shell comment $runId"
    $attachmentId = [guid]::NewGuid().ToString()
    $fileName = "qa-upload-$runId.txt"
    $fileText = "Attachment upload shell test $runId"
    $fileBytes = [System.Text.Encoding]::UTF8.GetBytes($fileText)

    Write-Host ""
    Write-Host "SC-CA-00 Delete previous draft if it exists"
    $draftDelete = Invoke-JsonRequest `
        -Client $client `
        -Method "Delete" `
        -Url "$BaseUrl/Bugs(ID=$BugId,IsActiveEntity=false)"
    if ($draftDelete.Response.IsSuccessStatusCode) {
        Write-Host "  PASS  previous draft deleted"
    } elseif ([int]$draftDelete.Response.StatusCode -eq 404) {
        Write-Host "  PASS  no existing draft"
    } else {
        Assert-SuccessResponse -Response $draftDelete.Response -Label "Delete existing draft"
    }

    Write-Host ""
    Write-Host "SC-CA-01 Add comment"
    $commentResponse = Invoke-JsonRequest `
        -Client $client `
        -Method "Post" `
        -Url "$BaseUrl/Bugs(ID=$BugId,IsActiveEntity=true)/BugService.addComment" `
        -Body @{ content = $commentText }
    Assert-SuccessResponse -Response $commentResponse.Response -Label "addComment"
    Write-Host "  PASS  addComment returned HTTP $([int]$commentResponse.Response.StatusCode)"

    $matchedCommentResponse = Wait-Until -Label "Comment marker $commentText" -Check {
        $commentList = Invoke-JsonRequest `
            -Client $client `
            -Method "Get" `
            -Url "$BaseUrl/Comments?`$orderby=createdAt desc&`$top=20"
        Assert-SuccessResponse -Response $commentList.Response -Label "Read comments"
        if ($commentList.Text -and $commentList.Text.Contains($commentText)) {
            return $commentList
        }
        return $null
    }
    Write-Host "  PASS  comment marker found in OData response"

    $commentHistoryResponse = Wait-Until -Label "Comment history marker $commentText" -Check {
        $historyList = Invoke-JsonRequest `
            -Client $client `
            -Method "Get" `
            -Url "$BaseUrl/HistoryLogs?`$orderby=createdAt desc&`$top=40"
        Assert-SuccessResponse -Response $historyList.Response -Label "Read history logs after comment"
        if ($historyList.Text -and $historyList.Text.Contains('"fieldName":"comment"') -and $historyList.Text.Contains($commentText)) {
            return $historyList
        }
        return $null
    }
    Write-Host "  PASS  comment history row found in OData response"

    Write-Host ""
    Write-Host "SC-CA-02 Resolve draft bug context for attachment flow"
    $draftBug = $null
    $draftRead = Invoke-JsonRequest `
        -Client $client `
        -Method "Get" `
        -Url "$BaseUrl/Bugs(ID=$BugId,IsActiveEntity=false)"
    if ($draftRead.Response.IsSuccessStatusCode -and $draftRead.Json -and $draftRead.Json.ID) {
        $draftBug = $draftRead.Json
        Write-Host "  PASS  existing draft context found for bug ID=$($draftBug.ID)"
    } else {
        $draftEditResponse = Invoke-JsonRequest `
            -Client $client `
            -Method "Post" `
            -Url "$BaseUrl/Bugs(ID=$BugId,IsActiveEntity=true)/BugService.draftEdit" `
            -Body @{ PreserveChanges = $true }
        Assert-SuccessResponse -Response $draftEditResponse.Response -Label "draftEdit"
        $draftBug = $draftEditResponse.Json
        if (-not $draftBug -or -not $draftBug.ID) {
            throw "Could not resolve a draft bug payload."
        }
        Write-Host "  PASS  draftEdit returned draft bug ID=$($draftBug.ID)"
    }

    Write-Host ""
    Write-Host "SC-CA-03 Create draft attachment metadata"
    $attachmentCreateResponse = Invoke-JsonRequest `
        -Client $client `
        -Method "Post" `
        -Url "$BaseUrl/Bugs(ID=$($draftBug.ID),IsActiveEntity=false)/attachments" `
        -Body @{
            ID        = $attachmentId
            fileName  = $fileName
            mediaType = "text/plain"
            fileSize  = $fileBytes.Length
        }
    Assert-SuccessResponse -Response $attachmentCreateResponse.Response -Label "Create draft attachment metadata"
    Write-Host "  PASS  attachment metadata created: ID=$attachmentId"

    Write-Host ""
    Write-Host "SC-CA-04 Upload draft attachment stream"
    $uploadResponse = Invoke-BinaryPut `
        -Client $client `
        -Url "$BaseUrl/Attachments(ID=$attachmentId,IsActiveEntity=false)/content" `
        -Bytes $fileBytes `
        -ContentType "text/plain" `
        -FileName $fileName
    Assert-SuccessResponse -Response $uploadResponse.Response -Label "Upload draft attachment content"
    Write-Host "  PASS  stream upload returned HTTP $([int]$uploadResponse.Response.StatusCode)"

    Write-Host ""
    Write-Host "SC-CA-05 Verify draft attachment metadata"
    $attachmentRead = Wait-Until -Label "Draft attachment metadata $attachmentId" -Check {
        $result = Invoke-JsonRequest `
            -Client $client `
            -Method "Get" `
            -Url "$BaseUrl/Attachments(ID=$attachmentId,IsActiveEntity=false)"
        Assert-SuccessResponse -Response $result.Response -Label "Read draft attachment metadata"
        if ($result.Json.mediaType -eq "text/plain" -and [int64]$result.Json.fileSize -eq $fileBytes.Length) {
            return $result.Json
        }
        return $null
    }
    Write-Host "  PASS  metadata read back with mediaType=$($attachmentRead.mediaType) and fileSize=$($attachmentRead.fileSize)"
    if (-not $attachmentRead.fileName) {
        Write-Host "  WARN  fileName is still null after upload; backend metadata handling needs follow-up"
    }

    Write-Host ""
    Write-Host "SC-CA-06 Activate draft"
    $activateResponse = Invoke-JsonRequest `
        -Client $client `
        -Method "Post" `
        -Url "$BaseUrl/Bugs(ID=$($draftBug.ID),IsActiveEntity=false)/BugService.draftActivate"
    Assert-SuccessResponse -Response $activateResponse.Response -Label "draftActivate"
    Write-Host "  PASS  draftActivate returned HTTP $([int]$activateResponse.Response.StatusCode)"

    Write-Host ""
    Write-Host "SC-CA-07 Download and verify active content"
    $downloadResponse = Invoke-BinaryGet `
        -Client $client `
        -Url "$BaseUrl/Attachments(ID=$attachmentId,IsActiveEntity=true)/content"
    Assert-SuccessResponse -Response $downloadResponse.Response -Label "Download active attachment content"
    $downloadedText = [System.Text.Encoding]::UTF8.GetString($downloadResponse.Bytes)
    if ($downloadedText -ne $fileText) {
        throw "Attachment content mismatch."
    }
    Write-Host "  PASS  downloaded content matches"

    Write-Host ""
    Write-Host "SC-CA-08 Verify attachment history"
    $attachmentHistoryResponse = Wait-Until -Label "Attachment history marker $fileName" -Check {
        $historyList = Invoke-JsonRequest `
            -Client $client `
            -Method "Get" `
            -Url "$BaseUrl/HistoryLogs?`$orderby=createdAt desc&`$top=40"
        Assert-SuccessResponse -Response $historyList.Response -Label "Read history logs after attachment"
        if ($historyList.Text -and $historyList.Text.Contains('"fieldName":"attachment"') -and $historyList.Text.Contains($fileName)) {
            return $historyList
        }
        return $null
    }
    Write-Host "  PASS  attachment history row found in OData response"

    Write-Host ""
    Write-Host "Artifacts:"
    Write-Host "  commentText   = $commentText"
    Write-Host "  attachmentId  = $attachmentId"
    Write-Host "  fileName      = $fileName"
    Write-Host "  bugId         = $BugId"
    Write-Host ""
    Write-Host "RESULT: PASS"
} finally {
    $client.Dispose()
}
