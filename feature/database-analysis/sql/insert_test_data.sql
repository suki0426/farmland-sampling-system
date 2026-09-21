USE farm_monitor;

--插入设备
INSERT INTO d_device(id, device_code, device_name, status) VALUES
('dev001','DEV001','采样终端1',1),
('dev002','DEV002','采样终端2',1);

--插入农田
INSERT INTO farmland(id,farmland_name,boundary_geo,coordinate_system) VALUES
('farm001','一号试验田','{}','WGS84');

--插入采样点
INSERT INTO sampling_point(id,farmland_id,lon,lat,coordinate_system,status) VALUES
('sp001','farm001',112.54321,37.87654,'WGS84',0),
('sp002','farm001',112.54421,37.87754,'WGS84',0);

--插入采样任务
INSERT INTO sampling_task(id,farmland_id,device_id,task_status) VALUES
('task001','farm001','dev001',2);

--插入模拟监测记录（时序测试数据）
INSERT INTO monitor_record(id,device_id,sampling_point_id,task_id,collect_time,air_temp,air_humidity,soil_temp,soil_humidity,soil_depth) VALUES
('m001','dev001','sp001','task001','2026-09-16 08:00:00',25.3,62.1,22.1,45.2,10.0),
('m002','dev001','sp001','task001','2026-09-16 09:00:00',26.1,60.3,22.4,44.8,10.0),
('m003','dev001','sp002','task001','2026-09-16 10:00:00',27.2,58.9,23.0,43.5,10.0);

--插入轨迹测试数据
INSERT INTO device_trajectory(id,device_id,collect_time,lon,lat,coordinate_system) VALUES
('t001','dev001','2026-09-16 08:00:00',112.54321,37.87654,'WGS84'),
('t002','dev001','2026-09-16 09:00:00',112.54350,37.87680,'WGS84');
