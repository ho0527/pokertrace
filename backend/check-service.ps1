$servicename="PokerTrace"
$redisport=6379
$backendpath=Split-Path -Parent $MyInvocation.MyCommand.Path
$logpath=Join-Path $backendpath "log\server.log"
$expectedworkercount=6
$faileded=$false

Write-Host ""
Write-Host "=== PokerTrace service check ==="
Write-Host ""

$service=Get-Service -Name $servicename -ErrorAction SilentlyContinue
if($null -eq $service){
    Write-Host "[FAIL] service not found: $servicename"
    $faileded=$true
}
else{
    if($service.Status -eq "Running"){
        Write-Host "[PASS] service running: $servicename"
    }
    else{
        Write-Host "[FAIL] service status: $($service.Status)"
        $faileded=$true
    }
}

$redischeck=Test-NetConnection 127.0.0.1 -Port $redisport -WarningAction SilentlyContinue
if($redischeck.TcpTestSucceeded){
    Write-Host "[PASS] redis port open: 127.0.0.1:$redisport"
}
else{
    Write-Host "[FAIL] redis port closed: 127.0.0.1:$redisport"
    $faileded=$true
}

$backendcheck=Test-NetConnection 127.0.0.1 -Port 8061 -WarningAction SilentlyContinue
if($backendcheck.TcpTestSucceeded){
    Write-Host "[PASS] backend port open: 127.0.0.1:8061"
}
else{
    Write-Host "[FAIL] backend port closed: 127.0.0.1:8061"
    $faileded=$true
}

if(Test-Path $logpath){
    $logtail=Get-Content $logpath -Tail 80
    $startupline=Select-String -Path $logpath -Pattern "Uvicorn running on http://127.0.0.1:8061" | Select-Object -Last 1
    $activityline=$logtail | Select-String -Pattern "HTTP/1.0|HTTP/1.1|WebSocket /ws/"
    $workerlinecount=(Select-String -Path $logpath -Pattern "Started server process \[" | Measure-Object).Count

    if($startupline){
        Write-Host "[PASS] startup log found: $logpath"
    }
    else{
        Write-Host "[WARN] startup log not found in last 80 lines: $logpath"
    }

    if($activityline){
        Write-Host "[PASS] recent request or websocket activity found"
    }
    else{
        Write-Host "[WARN] no recent request or websocket activity in last 80 lines"
    }

    if($workerlinecount -ge 1){
        Write-Host "[PASS] worker startup lines found: $workerlinecount"
    }
    else{
        Write-Host "[FAIL] no worker startup line found in log"
        $faileded=$true
    }

    if($workerlinecount -ge $expectedworkercount){
        Write-Host "[PASS] worker startup count reached expected baseline: $expectedworkercount"
    }
    else{
        Write-Host "[WARN] worker startup count below expected baseline: $workerlinecount / $expectedworkercount"
    }
}
else{
    Write-Host "[FAIL] log file not found: $logpath"
    $faileded=$true
}

Write-Host ""
if($faileded){
    Write-Host "RESULT: FAIL"
    exit 1
}
else{
    Write-Host "RESULT: PASS"
    exit 0
}
