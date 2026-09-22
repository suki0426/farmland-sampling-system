<#
  星穹耕界接收端启动器

  启动范围：Redis、Vue 前端、Spring Boot 后端（含 UDP 9000 接收器）。
  不启动任何本机 Mock 发送器；三名设备组员应向本机局域网 IP 的 UDP 9000 发送报文。
#>
[CmdletBinding()]
param(
    [string]$DatabaseName = 'farm_monitor',
    [string]$DatabaseUser = 'root',
    [int]$FrontendPort = 3006,
    [int]$BackendPort = 8087,
    [int]$UdpPort = 9000,
    [string]$RedisServerPath = ''
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $projectRoot 'frontend'
$backendDir = Join-Path $projectRoot 'backend'

function Test-ListeningPort([int]$Port) {
    return $null -ne (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Get-LanIpv4 {
    $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
        Select-Object -First 1 -ExpandProperty IPAddress
    return $ip
}

if (-not (Test-Path $frontendDir) -or -not (Test-Path $backendDir)) {
    throw "未找到项目目录。请从仓库的 scripts 目录运行本脚本。"
}

if (Test-ListeningPort $BackendPort) {
    throw "端口 $BackendPort 已被占用。请先确认已有后端是否就是本项目，再重新运行。"
}
if (Test-ListeningPort $UdpPort) {
    throw "UDP 端口 $UdpPort 已被占用。接收端一次只能运行一个。"
}

$maven = Get-Command mvn.cmd -ErrorAction SilentlyContinue
if ($null -eq $maven) { $maven = Get-Command mvn -ErrorAction SilentlyContinue }
if ($null -eq $maven) { throw '未找到 Maven。请将 Maven bin 目录加入 PATH 后重试。' }
if ($null -eq (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw '未找到 Node.js/npm。请安装 Node.js 后重试。' }
if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    throw 'JAVA_HOME 未指向可用 JDK。后端要求 JDK 8，请设置 JAVA_HOME 后重试。'
}

if ([version](((& (Join-Path $env:JAVA_HOME 'bin\java.exe') -version 2>&1 | Select-Object -First 1) -replace '.*"([^\"]+)".*','$1')) -lt [version]'1.8') {
    throw 'JAVA_HOME 不是 JDK 8 或更高版本。请切换到 JDK 8。'
}

if (-not (Test-ListeningPort 6379)) {
    if (-not $RedisServerPath) {
        $defaultRedis = Join-Path $env:USERPROFILE 'Desktop\Redis\Redis\redis-server.exe'
        if (Test-Path $defaultRedis) { $RedisServerPath = $defaultRedis }
    }
    if (-not $RedisServerPath -or -not (Test-Path $RedisServerPath)) {
        throw 'Redis 未运行，且未找到 redis-server.exe。请传入 -RedisServerPath 后重试。'
    }
    Start-Process -FilePath $RedisServerPath -ArgumentList '--port 6379' -WindowStyle Minimized
    Start-Sleep -Seconds 2
    if (-not (Test-ListeningPort 6379)) { throw 'Redis 启动失败，端口 6379 未监听。' }
}

if (-not (Test-ListeningPort $FrontendPort)) {
    $frontendCommand = "Set-Location -LiteralPath '$frontendDir'; npm.cmd run serve -- --port $FrontendPort"
    Start-Process powershell.exe -ArgumentList '-NoExit', '-NoProfile', '-Command', $frontendCommand
}

$plainPassword = ''
try {
    $securePassword = Read-Host '请输入本机 MySQL 密码（只用于当前后端进程）' -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)

    $env:MYSQL_USERNAME = $DatabaseUser
    $env:MYSQL_PASSWORD = $plainPassword
    $env:MYSQL_DATABASE = $DatabaseName
    $env:REDIS_HOST = '127.0.0.1'
    $env:REDIS_PORT = '6379'

    $lanIp = Get-LanIpv4
    Write-Host ''
    Write-Host '接收端正在启动。' -ForegroundColor Green
    Write-Host "前端 GIS: http://localhost:$FrontendPort/gis.html#/"
    Write-Host "后端 API: http://localhost:$BackendPort"
    Write-Host "后端文档: http://localhost:$BackendPort/doc.html"
    Write-Host "UDP 接收: 0.0.0.0:$UdpPort"
    if ($lanIp) { Write-Host "请让三台发送端目标地址填写: $lanIp`:$UdpPort" -ForegroundColor Yellow }
    Write-Host '按 Ctrl+C 将停止后端；前端窗口可单独关闭。' -ForegroundColor Yellow

    Set-Location $backendDir
    & $maven.Source '-pl' 'jeeplus-web' '-am' 'spring-boot:run'
}
finally {
    Remove-Item Env:MYSQL_PASSWORD -ErrorAction SilentlyContinue
}
