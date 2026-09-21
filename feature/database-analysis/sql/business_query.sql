USE farm_monitor;

-- =====================1.批量插入监测记录（给5号后端调用）=====================
-- 注意：实际由后端传入参数，这里只是示例模板
-- INSERT INTO monitor_record(id,device_id,sampling_point_id,task_id,collect_time,air_temp,air_humidity,soil_temp,soil_humidity,soil_depth) VALUES (?,?,?,?,?,?,?,?,?,?);

-- =====================2.按设备+时间范围分页查询监测记录=====================
-- 入参：device_id，start_time，end_time，pageSize
SELECT 
    id,device_id,sampling_point_id,task_id,collect_time,
    air_temp,air_humidity,soil_temp,soil_humidity,soil_depth
FROM monitor_record
WHERE del_flag=0
AND device_id = ?
AND collect_time >= ? AND collect_time < ?
ORDER BY collect_time DESC
LIMIT ?;

-- =====================3.设备轨迹查询：设备ID+起止时间=====================
SELECT id,device_id,collect_time,lon,lat,coordinate_system
FROM device_trajectory
WHERE del_flag=0
AND device_id = ?
AND collect_time >= ? AND collect_time < ?
ORDER BY collect_time ASC;

-- =====================4.聚合统计：时间区间内指标均值最大最小=====================
SELECT
    AVG(air_temp) avg_air_temp,
    MAX(air_temp) max_air_temp,
    MIN(air_temp) min_air_temp,
    AVG(soil_humidity) avg_soil_humidity
FROM monitor_record
WHERE del_flag=0
AND device_id = ?
AND collect_time >= ? AND collect_time < ?;

-- =====================5.按农田查询所有采样点=====================
SELECT id,farmland_id,lon,lat,status
FROM sampling_point
WHERE del_flag=0 AND farmland_id = ?;
