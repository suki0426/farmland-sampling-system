import pymysql
from openpyxl import Workbook
import os
from datetime import datetime

def get_db_conn():
    return pymysql.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="123456",
        database="farm_monitor",
        charset="utf8mb4"
    )

def export_monitor_excel(output_file_path, device_id=None, start_time=None, end_time=None):
    conn = get_db_conn()
    cursor = conn.cursor()
    sql = """
    SELECT collect_time, device_id, sampling_point_id, air_temp, air_humidity, soil_temp, soil_humidity, soil_depth
    FROM monitor_record
    WHERE del_flag=0
    """
    params = []
    if device_id:
        sql += " AND device_id = %s"
        params.append(device_id)
    if start_time:
        sql += " AND collect_time >= %s"
        params.append(start_time)
    if end_time:
        sql += " AND collect_time < %s"
        params.append(end_time)
    sql += " ORDER BY collect_time DESC"

    cursor.execute(sql, params)
    rows = cursor.fetchall()

    wb = Workbook()
    ws = wb.active
    ws.title = "采样监测记录"
    headers = ["采集时间", "设备ID", "采样点ID", "空气温度", "空气湿度", "土壤温度", "土壤湿度", "土壤深度"]
    ws.append(headers)

    for row in rows:
        # row[0] 就是 collect_time，是datetime对象，格式化字符串
        col_list = list(row)
        dt_obj = col_list[0]
        if isinstance(dt_obj, datetime):
            # 转为可读时间字符串 "2026-09-16 08:00:00"
            col_list[0] = dt_obj.strftime("%Y-%m-%d %H:%M:%S")
        ws.append(col_list)

    output_dir = os.path.dirname(output_file_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    wb.save(output_file_path)
    cursor.close()
    conn.close()
    print(f"导出完成：{os.path.abspath(output_file_path)}")

if __name__ == "__main__":
    export_monitor_excel("./test_output.xlsx", device_id="dev001", start_time="2026-09-16 00:00:00", end_time="2026-09-17 00:00:00")
