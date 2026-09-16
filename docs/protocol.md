# 三终端数据协议草案

未来三个采样终端统一使用 `device_id` 区分设备。传输方式、数据类型、单位、精度、校验和重传策略将在设备联调阶段补充。

## 预留字段

| 字段 | 说明 |
| --- | --- |
| `device_id` | 设备唯一标识 |
| `point_id` | 采样点标识 |
| `longitude` | 经度 |
| `latitude` | 纬度 |
| `soil_moisture` | 土壤湿度 |
| `soil_temperature` | 土壤温度 |
| `ph` | 土壤酸碱度 |
| `sample_depth` | 采样深度 |
| `status` | 设备或采样状态 |
| `timestamp` | 数据采集时间戳 |

当前为协议草案，最终字段在业务开发阶段冻结。
