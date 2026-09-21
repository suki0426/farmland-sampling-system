-- 初始化库表脚本 可重复执行
CREATE DATABASE IF NOT EXISTS farm_monitor DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE farm_monitor;

-- 1.设备表 d_device
DROP TABLE IF EXISTS d_device;
CREATE TABLE d_device (
    id VARCHAR(64) PRIMARY KEY COMMENT '主键',
    device_code VARCHAR(64) NOT NULL UNIQUE COMMENT '设备编号 DEV001/DEV002',
    device_name VARCHAR(128) COMMENT '设备名称',
    status TINYINT DEFAULT 0 COMMENT '0离线 1在线',
    create_by VARCHAR(64),
    create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64),
    update_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_flag TINYINT DEFAULT 0 COMMENT '0正常 1删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备信息表';

--2.农田表 farmland
DROP TABLE IF EXISTS farmland;
CREATE TABLE farmland (
    id VARCHAR(64) PRIMARY KEY COMMENT '农田主键',
    farmland_name VARCHAR(128) NOT NULL COMMENT '农田名称',
    boundary_geo JSON COMMENT '农田边界GeoJSON',
    coordinate_system VARCHAR(32) COMMENT '坐标系 WGS84/GCJ02',
    create_by VARCHAR(64),
    create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64),
    update_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_flag TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='农田信息表';

--3.采样点表 sampling_point
DROP TABLE IF EXISTS sampling_point;
CREATE TABLE sampling_point (
    id VARCHAR(64) PRIMARY KEY COMMENT '采样点主键(不是UDP的2字节编号)',
    farmland_id VARCHAR(64) NOT NULL COMMENT '关联农田id',
    lon DECIMAL(10,6) COMMENT '经度',
    lat DECIMAL(10,6) COMMENT '纬度',
    coordinate_system VARCHAR(32),
    status TINYINT DEFAULT 0 COMMENT '0未采样 1已采样',
    create_by VARCHAR(64),
    create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64),
    update_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_flag TINYINT DEFAULT 0,
    FOREIGN KEY(farmland_id) REFERENCES farmland(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采样点表';

--4.采样任务表 sampling_task
DROP TABLE IF EXISTS sampling_task;
CREATE TABLE sampling_task (
    id VARCHAR(64) PRIMARY KEY COMMENT '任务id',
    farmland_id VARCHAR(64) NOT NULL,
    device_id VARCHAR(64) NOT NULL COMMENT '执行设备id',
    task_status TINYINT DEFAULT 0 COMMENT '0待执行 1执行中 2完成',
    create_by VARCHAR(64),
    create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64),
    update_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_flag TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采样任务表';

--5.监测记录表 monitor_record【核心时序表】
DROP TABLE IF EXISTS monitor_record;
CREATE TABLE monitor_record (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL COMMENT '设备id',
    sampling_point_id VARCHAR(64) COMMENT '采样点id',
    task_id VARCHAR(64) COMMENT '任务id',
    collect_time DATETIME NOT NULL COMMENT '设备采集时间【时序核心】',
    air_temp REAL COMMENT '空气温度',
    air_humidity REAL COMMENT '空气湿度',
    soil_temp REAL COMMENT '土壤温度',
    soil_humidity REAL COMMENT '土壤湿度',
    soil_depth REAL COMMENT '土壤深度',
    create_by VARCHAR(64),
    create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64),
    update_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_flag TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='监测采样记录表';

--6.设备轨迹表 device_trajectory
DROP TABLE IF EXISTS device_trajectory (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    collect_time DATETIME NOT NULL COMMENT '上报时间',
    lon DECIMAL(10,6),
    lat DECIMAL(10,6),
    coordinate_system VARCHAR(32),
    create_by VARCHAR(64),
    create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64),
    update_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_flag TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备轨迹记录表';

-- ======================索引建设======================
-- monitor_record 高频查询索引
CREATE INDEX idx_device_collect ON monitor_record(device_id, collect_time);
CREATE INDEX idx_point_collect ON monitor_record(sampling_point_id, collect_time);
CREATE INDEX idx_collect_time ON monitor_record(collect_time);

-- 采样点索引：按农田查点位
CREATE INDEX idx_farmland_status ON sampling_point(farmland_id, status, del_flag);

-- 轨迹索引：设备+时间
CREATE INDEX idx_device_trajectory ON device_trajectory(device_id, collect_time);
