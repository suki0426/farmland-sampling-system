# 5号后端与系统集成说明

## 本次可独立完成的内容

- UDP 接收器：开发环境默认监听 `9000`，由 Spring 生命周期启动和停止，不阻塞 Web 线程。
- `JsonDeviceMessageDecoder`：接收 JSON，兼容 `deviceId` 和协议草案的 `device_id`。
- 数据校验：设备标识、经纬度范围、时间格式；坏报文仅记录 WARN 并丢弃。
- `DeviceTelemetryService` + `InMemoryDeviceTelemetryService`：保存实时位置与每台设备最近 1000 条轨迹。
- 采样点、路线算法适配器和明确标注的 Mock 实现。
- 用于本地联调的三设备 UDP 发送脚本。

本模块只提供系统集成边界，不修改 A-D 已冻结的农田、设备、任务、监测表和业务实现。

## 配置

开发配置位于 `backend/jeeplus-web/src/main/resources/application-dev.yml`：

```yaml
integration:
  device-udp:
    enabled: true
    port: 9000
    max-track-size: 1000
  algorithm:
    mode: mock
```

将 `enabled` 设为 `false` 可停用 UDP 接收器。端口占用时应用仍会继续启动，日志会标识启动失败。

## 当前 REST 接口

所有接口沿用 JeePlus 的 `ResponseEntity` 返回方式，并需要在系统菜单/权限中配置相应权限。

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/integration/telemetry/realtime` | `integration:telemetry:list` | 当前收到的设备实时位置 |
| GET | `/integration/telemetry/{deviceId}/track?limit=100` | `integration:telemetry:list` | 指定设备最近轨迹，最多 1000 条 |
| GET | `/integration/udp/status` | `integration:telemetry:list` | UDP 运行状态与接收/拒绝计数 |
| POST | `/integration/sampling-points/generate` | `integration:algorithm:execute` | 调用 Mock 采样点适配器 |
| POST | `/integration/routes/plan` | `integration:algorithm:execute` | 调用 Mock 路线适配器 |

## UDP Mock 协议

```json
{
  "deviceId": "DEVICE_001",
  "taskId": "MOCK-TASK-001",
  "longitude": 112.123456,
  "latitude": 37.123456,
  "coordinateSystem": "WGS84",
  "status": "MOCK_MOVING",
  "timestamp": "2026-09-18 10:30:00"
}
```

`timestamp` 支持 `yyyy-MM-dd HH:mm:ss` 或 ISO-8601 带时区字符串。可运行：

```bash
python scripts/send_mock_field_sampling_udp.py
```

该脚本只用于 5 号本地联调，不是 2 号的正式终端实现。

## Mock 与替换点

- `InMemoryDeviceTelemetryService`：重启后轨迹丢失；不写任何数据库表。
- `MockSamplingAlgorithmService`：只按输入边界/点位顺序返回临时结果；不实现 Point-in-Polygon、最近邻、2-opt 或分区。
- `JsonDeviceMessageDecoder`：仅为当前联调 JSON；不代表最终设备协议。

## 等待对接

- **1号（GIS）**：确认地图端调用路径、权限菜单，以及边界 GeoJSON 到 `boundary: List<CoordinateDTO>` 的转换。
- **2号（终端）**：冻结 IP、端口、编码、时间格式、字段名和重传规则；若不是 JSON，增加新的 `DeviceMessageDecoder` 实现。
- **3号（算法）**：交付 Python 算法进程/调用契约后，实现 `SamplingAlgorithmService` 适配器替换 Mock。
- **4号（数据）**：冻结遥测/归档表结构后，实现 `DeviceTelemetryService` 的 MySQL 版本替换内存实现。
