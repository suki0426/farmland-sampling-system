# 接收端一键启动说明

此启动器用于组长/5号所在电脑：启动 Redis、前端和后端 UDP 接收器。它**不会**启动本机设备模拟器。

## 前置条件

- JDK 8 的 `JAVA_HOME`
- Maven 已加入 `PATH`
- Node.js/npm 已安装
- 本机 MySQL 中已有演示数据库（默认 `farm_monitor`）
- Redis 已安装；默认查找 `%USERPROFILE%\Desktop\Redis\Redis\redis-server.exe`

## 启动

最简单的方式是双击：

```text
scripts\\start-receiver-demo.cmd
```

它会保留错误窗口，不会一闪而过。

也可以在仓库根目录打开 PowerShell，执行：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\scripts\start-receiver-demo.ps1
```

脚本会安全提示输入 MySQL 密码，仅传给当前后端进程，不会写入仓库或配置文件。

只检查本机环境、不启动服务：

```powershell
.\scripts\start-receiver-demo.ps1 -CheckOnly
```

可按需指定数据库或 Redis 路径：

```powershell
.\scripts\start-receiver-demo.ps1 -DatabaseName farm_monitor -RedisServerPath 'D:\Redis\redis-server.exe'
```

## 发送端组员需要填写

启动器会显示本机局域网 IPv4。三台设备发送端都应填写：

- 主机：该 IPv4 地址
- UDP 端口：`9000`

不要填写 `127.0.0.1`，那只会发到发送端自己的电脑。

若 Windows 防火墙首次询问 Java 网络访问，请允许“专用网络”；否则局域网 UDP 报文可能无法到达。

## 演示地址

- GIS：`http://localhost:3006/gis.html#/`
- 后端：`http://localhost:8087`
- API 文档：`http://localhost:8087/doc.html`
