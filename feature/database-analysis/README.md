
## 数据库信息
数据库名：`farm_monitor`
字符集：`utf8mb4`

### 6张业务表说明
1. **d_device** 设备表：存储采样终端设备基础信息
2. **farmland** 农田表：农田基础信息、边界GeoJSON、坐标系
3. **sampling_point** 采样点表
> 注意：UDP协议帧的2字节采样点编号 ≠本表主键id；协议编号映射逻辑由5号后端处理。
4. **sampling_task** 采样任务表：记录采样任务信息、任务状态
5. **monitor_record** 监测记录表【核心时序表】
collect_time：设备采集上报时间，不等于数据库入库create_date。
6. **device_trajectory** 设备轨迹表：保存设备移动历史位置。

> 所有表均包含逻辑删除字段 del_flag：0正常，1删除；所有业务查询必须带上 `del_flag=0`。

## 索引设计说明
1. monitor_record
    - `idx_device_collect(device_id, collect_time)`：按设备+时间查询历史监测数据
    - `idx_point_collect(sampling_point_id, collect_time)`：按采样点查询监测
    - `idx_collect_time(collect_time)`：全局时间范围筛选
2. sampling_point
    - `idx_farmland_status(farmland_id, status, del_flag)`：查询某农田下面全部采样点
3. device_trajectory
    - `idx_device_trajectory(device_id, collect_time)`：设备轨迹回放查询

> 验证索引：使用 `EXPLAIN` 执行SQL，观察输出是否出现`USING INDEX`。

## SQL脚本使用步骤
1. 执行 `init_schema.sql`：完成建表、建立索引；
2. 执行 `insert_test_data.sql`：导入模拟测试数据，用于本地自测；
3. 参考`business_query.sql`里面的模板完成业务查询。

## Excel导出模块
文件路径：`python_export/excel_exporter.py`
函数：`export_monitor_excel(output_file_path, device_id, start_time, end_time)`
- 输入：输出文件路径、设备ID、时间起止；
- 输出：生成xlsx采样监测记录文件；
> 注意：当前本地调试版本写死数据库密码，**仅用于本地自测**；正式环境由5号SpringBoot接管数据库连接，不再使用本文件内写死的账号密码。

## 对外对接说明（给5号后端）
1. 5号执行init_schema.sql完成数据库初始化；
2. 5号根据表结构编写Entity、Mapper、Service；
3. 2号设备模拟器UDP报文 →5号解析校验映射 →调用批量插入SQL写入monitor_record；
4. 3号算法生成采样点数据 →5号调用SQL写入sampling_point；
5. 历史查询、轨迹、统计、Excel导出全部由5号封装REST接口，前端1号只调用后端接口，不直接访问数据库。

## 自测验收
1. SQL脚本执行无报错；
2. 测试数据可以正常插入；
3. 业务查询SQL返回预期结果，索引生效；
4. Excel导出脚本运行成功，时间字段正常格式化输出。
