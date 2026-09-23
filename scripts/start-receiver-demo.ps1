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
    [string]$RedisServerPath = '',
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
trap {
    Write-Host ''
    Write-Host "启动器失败：$($_.Exception.Message)" -ForegroundColor Red
    if (-not $CheckOnly) { Read-Host '请按 Enter 关闭此窗口' }
    exit 1
}
$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $projectRoot 'frontend'
$backendDir = Join-Path $projectRoot 'backend'

function Test-ListeningPort([int]$Port) {
    return $null -ne (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Test-UdpListeningPort([int]$Port) {
    return $null -ne (Get-NetUDPEndpoint -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Get-LanIpv4 {
    $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
        Select-Object -First 1 -ExpandProperty IPAddress
    return $ip
}

function Find-Maven {
    $command = Get-Command mvn.cmd -ErrorAction SilentlyContinue
    if ($null -eq $command) { $command = Get-Command mvn -ErrorAction SilentlyContinue }
    if ($null -ne $command) { return $command.Source }

    if ($env:MAVEN_HOME) {
        $fromEnvironment = Join-Path $env:MAVEN_HOME 'bin\mvn.cmd'
        if (Test-Path $fromEnvironment) { return $fromEnvironment }
    }

    $temporaryMaven = Get-ChildItem -Path "$env:SystemDrive\temp\apache-maven-*\bin\mvn.cmd" -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
    if ($temporaryMaven) { return $temporaryMaven }

    return $null
}

if (-not (Test-Path $frontendDir) -or -not (Test-Path $backendDir)) {
    throw "未找到项目目录。请从仓库的 scripts 目录运行本脚本。"
}

$backendAlreadyRunning = Test-ListeningPort $BackendPort
$udpAlreadyListening = Test-UdpListeningPort $UdpPort
if ($backendAlreadyRunning) {
    if (-not $udpAlreadyListening) {
        throw "端口 $BackendPort 的现有后端未监听 UDP $UdpPort，不能作为设备接收端。请先在原后端窗口按 Ctrl+C 停止它，再重新双击启动器。"
    }
    Write-Host "后端端口 $BackendPort 已在监听，将复用现有后端。" -ForegroundColor Yellow
} elseif ($udpAlreadyListening) {
    throw "UDP 端口 $UdpPort 已被其他程序占用。请先关闭该程序后重试。"
}

$maven = Find-Maven
if (-not $maven) { throw '未找到 Maven。请将 Maven bin 目录加入 PATH，或设置 MAVEN_HOME 后重试。' }
if ($null -eq (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw '未找到 Node.js/npm。请安装 Node.js 后重试。' }
if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    throw 'JAVA_HOME 未指向可用 JDK。后端要求 JDK 8，请设置 JAVA_HOME 后重试。'
}

$javaHomeName = Split-Path -Leaf $env:JAVA_HOME
if ($javaHomeName -notmatch '(?i)jdk.*(1\.8|8)') {
    throw "JAVA_HOME 当前为 $env:JAVA_HOME。本项目后端要求 JDK 8，请切换后重试。"
}

if (-not $RedisServerPath) {
    $defaultRedis = Join-Path $env:USERPROFILE 'Desktop\Redis\Redis\redis-server.exe'
    if (Test-Path $defaultRedis) { $RedisServerPath = $defaultRedis }
}
if (-not (Test-ListeningPort 6379)) {
    if (-not $RedisServerPath -or -not (Test-Path $RedisServerPath)) {
        throw 'Redis 未运行，且未找到 redis-server.exe。请传入 -RedisServerPath 后重试。'
    }
    if ($CheckOnly) {
        Write-Host "Redis 将使用：$RedisServerPath" -ForegroundColor Green
    } else {
    Start-Process -FilePath $RedisServerPath -ArgumentList '--port 6379' -WindowStyle Minimized
    Start-Sleep -Seconds 2
    if (-not (Test-ListeningPort 6379)) { throw 'Redis 启动失败，端口 6379 未监听。' }
    }
}

if ($CheckOnly) {
    Write-Host '接收端预检通过。' -ForegroundColor Green
    Write-Host "JDK: $env:JAVA_HOME"
    Write-Host "Maven: $maven"
    Write-Host "前端目录: $frontendDir"
    Write-Host "后端目录: $backendDir"
    Write-Host "端口: 前端 $FrontendPort、后端 $BackendPort、UDP $UdpPort、Redis 6379"
    if ($backendAlreadyRunning) { Write-Host "后端状态: 已运行（端口 $BackendPort）" }
    exit 0
}

if (-not (Test-ListeningPort $FrontendPort)) {
    $frontendCommand = "Set-Location -LiteralPath '$frontendDir'; npm.cmd run serve -- --port $FrontendPort"
    Start-Process powershell.exe -ArgumentList '-NoExit', '-NoProfile', '-Command', $frontendCommand
}

if ($backendAlreadyRunning) {
    Write-Host ''
    Write-Host '接收端后端已经在运行，无需重复启动。' -ForegroundColor Green
    Write-Host "前端 GIS: http://localhost:$FrontendPort/gis.html#/"
    Write-Host "后端 API: http://localhost:$BackendPort"
    Write-Host "后端文档: http://localhost:$BackendPort/doc.html"
    Write-Host "UDP 接收: 0.0.0.0:$UdpPort"
    return
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
    & $maven '-pl' 'jeeplus-web' '-am' 'spring-boot:run'
}
finally {
    Remove-Item Env:MYSQL_PASSWORD -ErrorAction SilentlyContinue
}
