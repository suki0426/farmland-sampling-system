package com.jeeplus.common.influxdb;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.InfluxDBClientFactory;
import com.influxdb.client.QueryApi;
import com.influxdb.client.WriteApi;
import com.influxdb.client.domain.Bucket;
import com.influxdb.client.domain.WritePrecision;
import com.influxdb.client.write.Point;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;
import com.jeeplus.common.vo.InfluxDbSelectVO;
import com.jeeplus.common.vo.InfluxQueryResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Component
public class InfluxDBUtils {

    @Value("${influxdb.url}")
    private static String INFLUXDB_URL;
    @Value("${influxdb.token}")
    private static String TOKEN;
    @Value("${influxdb.bucket}")
    private static String BUCKET;
    @Value("${influxdb.org}")
    private static String ORGANIZATION;

    private static InfluxDBClient client;

    @Value("${influxdb.url}")
    public void setInfluxdbUrl(String url) {
        INFLUXDB_URL = url;
    }

    @Value("${influxdb.token}")
    public void setToken(String token) {
        TOKEN = token;
    }

    @Value("${influxdb.bucket}")
    public void setBucket(String bucket) {
        BUCKET = bucket;
    }

    @Value("${influxdb.org}")
    public void setOrganization(String organization) {
        ORGANIZATION = organization;
    }

    // 初始化客户端（需确保在setter之后执行，可放在静态代码块或通过@PostConstruct）
    @PostConstruct
    public void initClient() {
        client = InfluxDBClientFactory.create(INFLUXDB_URL, TOKEN.toCharArray());
    }

    /**
     * 写入数据点到 InfluxDB
     *
     * @param measurement 测量名称（表名）
     * @param tags        标签
     * @param fields      字段
     * @param precision   时间精度（如 WritePrecision.S）
     */
    public static void writePoint (String measurement, Map<String, String> tags,
                                  Map<String, Object> fields, WritePrecision precision) {
        try (WriteApi writeApi = client.getWriteApi()) {
            Point point = Point.measurement(measurement);
            tags.forEach(point::addTag);
            fields.forEach((key, value) -> {
                if (value instanceof Number) point.addField(key, (Number) value);
                else if (value instanceof String) point.addField(key, (String) value);
                else if (value instanceof Boolean) point.addField(key, (Boolean) value);
            });

            long timestamp = System.currentTimeMillis();
            if (precision == WritePrecision.S) timestamp /= 1000;
            else if (precision == WritePrecision.US) timestamp *= 1000;
            else if (precision == WritePrecision.NS) timestamp *= 1000000;
            point.time(timestamp, precision);

            writeApi.writePoint(BUCKET, ORGANIZATION, point);
        }
    }

    /**
     * 查询某个设备的数据
     *
     * @param measurement 测量名称
     * @param id          设备 ID
     * @param start       开始时间（ISO8601 格式）
     * @param end         结束时间（ISO8601 格式）
     * @return 查询结果
     */
    public static List<FluxTable> queryData(String measurement, String id, String start, String end) {
        // 如果 start 或 end 为空，则设置默认时间范围
        if (start == null || start.isEmpty()) {
            start = "-1h"; // 默认过去1小时
        }
        if (end == null || end.isEmpty()) {
            end = "now()"; // 默认到现在
        }

        String fluxQuery = String.format(
                "from(bucket: \"%s\")\n" +
                        " |> range(start: %s, stop: %s)\n" +
                        " |> filter(fn: (r) => r._measurement == \"%s\" and r.id == \"%s\")\n" +
                        " |> limit(n: 1)",
                BUCKET, start, end, measurement, id);

        List<FluxTable> query = client.getQueryApi().query(fluxQuery, ORGANIZATION);

        return query;
    }

    /**
     * 查询最新一条记录
     *
     * @param measurement 测量名称
     * @param id          设备 ID
     * @return 最新记录
     */
    public static List<FluxTable> queryLatestData(String measurement, String id) {
        String fluxQuery = String.format(
                "from(bucket: \"%s\")\n" +
                        " |> range(start: -30d)\n" +
                        " |> filter(fn: (r) => r._measurement == \"%s\" and r.id == \"%s\")\n" +
                        " |> limit(n: 1, offset: 0)",
                BUCKET, measurement, id);

        return client.getQueryApi().query(fluxQuery, ORGANIZATION);
    }

    /**
     * 查询距离指定时间最近的一条记录
     *
     * @param selectVO
     * @return 最近的记录
     */
    public static List<FluxTable> queryNearestData(InfluxDbSelectVO selectVO) {
        StringBuilder fluxQuery = new StringBuilder();
        // 导入 math 包
        fluxQuery.append("import \"math\"\n");

        // 扩大时间范围以确保能找到数据
        fluxQuery.append(String.format(
                "from(bucket: \"%s\")\n" +
                        " |> range(start: " + selectVO.getHour() + ")\n" +
                        " |> filter(fn: (r) => r._measurement == \"%s\" and r.id == \"%s\")\n",
                BUCKET, selectVO.getMeasurement(), selectVO.getId()));

        // 添加字段过滤条件
        if (selectVO.getNo() != null) {
            fluxQuery.append(String.format(" |> filter(fn: (r) => r[\"_field\"] == \"no\" and r[\"_value\"] == %d)\n", selectVO.getNo()));
        }
        if (selectVO.getType() != null) {
            fluxQuery.append(String.format(" |> filter(fn: (r) => r[\"_field\"] == \"type\" and r[\"_value\"] == %d)\n", selectVO.getType()));
        }
        if (selectVO.getR() != null) {
            fluxQuery.append(String.format(" |> filter(fn: (r) => r[\"_field\"] == \"r\" and r[\"_value\"] == %d)\n", selectVO.getR()));
        }

        // 先 pivot 转换格式，将字段转换为列
        fluxQuery.append(" |> pivot(rowKey:[\"_time\"], columnKey: [\"_field\"], valueColumn: \"_value\")\n");

        // 计算每条记录的时间与目标时间的差值
        fluxQuery.append(String.format(
                " |> map(fn: (r) => ({ r with diff: math.abs(x: float(v: int(v: r._time) - %d)) }))\n" +
                        " |> sort(columns: [\"diff\"], desc: false)\n" +
                        " |> limit(n: 1)",
                selectVO.getTargetTime()));

        QueryApi queryApi = client.getQueryApi();
        return queryApi.query(fluxQuery.toString(), ORGANIZATION);
    }

    /**
     * 查询距离指定时间点**之前**的最近一条记录
     *
     * @param selectVO 包含目标时间、测量名称等参数
     * @return 目标时间之前的最近记录
     */
    public static List<FluxTable> queryNearestDataBeforeTarget(InfluxDbSelectVO selectVO) {
        StringBuilder fluxQuery = new StringBuilder();
        //处理时间数据
        //获取目标时间纳秒戳
        long targetTimeNanos = selectVO.getTargetTime();

        Instant targetInstant = Instant.ofEpochMilli(targetTimeNanos / 1_000_000L);
        ZonedDateTime targetZonedDateTime = targetInstant.atZone(ZoneId.of("GMT+8"));
        LocalDateTime targetLocalDateTime = targetZonedDateTime.toLocalDateTime();
        // 获取当天0点的LocalDateTime（重置时分秒为00:00:00）
        LocalDateTime dayStartLocalDateTime = LocalDateTime.of(
                targetLocalDateTime.getYear(),
                targetLocalDateTime.getMonth(),
                targetLocalDateTime.getDayOfMonth(),
                0, 0, 0
        );
        ZonedDateTime dayStartZonedDateTime = dayStartLocalDateTime.atZone(ZoneId.of("GMT+8"));
        long dayStartNanos = dayStartZonedDateTime.toInstant().toEpochMilli() * 1_000_000L;

        // 导入math包用于计算时间差
        fluxQuery.append("import \"math\"\n");

        // 1. 基础查询范围（扩大查询区间，确保包含足够数据）
        fluxQuery.append(String.format(
                "from(bucket: \"%s\")\n" +
                        " |> range(start: time(v: %d), stop: time(v: %d))\n" + // 当天0点作为start，目标时间作为stop
                        " |> filter(fn: (r) => r._measurement == \"%s\" and r.id == \"%s\")\n",
                BUCKET, dayStartNanos, targetTimeNanos,
                selectVO.getMeasurement(), selectVO.getId()));

        // 2. 字段过滤（按需添加）
        if (selectVO.getNo() != null) {
            fluxQuery.append(String.format(" |> filter(fn: (r) => r[\"_field\"] == \"no\" and r[\"_value\"] == %d)\n", selectVO.getNo()));
        }
        if (selectVO.getType() != null) {
            fluxQuery.append(String.format(" |> filter(fn: (r) => r[\"_field\"] == \"type\" and r[\"_value\"] == %d)\n", selectVO.getType()));
        }
        if (selectVO.getR() != null) {
            fluxQuery.append(String.format(" |> filter(fn: (r) => r[\"_field\"] == \"r\" and r[\"_value\"] == %d)\n", selectVO.getR()));
        }

        fluxQuery.append(String.format(
                " |> filter(fn: (r) => r._time <= time(v: %d))\n",
                targetTimeNanos
        ));

        fluxQuery.append(" |> pivot(rowKey:[\"_time\"], columnKey: [\"_field\"], valueColumn: \"_value\")\n");

        fluxQuery.append(String.format(
                " |> map(fn: (r) => ({ r with diff: float(v: %d - int(v: r._time)) }))\n" +
                        " |> sort(columns: [\"diff\"], desc: false)\n" +
                        " |> limit(n: 1)",
                targetTimeNanos
        ));

        String finalFluxQuery = fluxQuery.toString();
        System.out.println("完整Flux查询语句（当天0点到目标时间）：\n" + finalFluxQuery);

        QueryApi queryApi = client.getQueryApi();
        return queryApi.query(fluxQuery.toString(), ORGANIZATION);
    }

    /**
     * 查询当前时间前15秒的数据
     * @param measurement InfluxDB measurement
     * @param deviceId 设备id
     * @return R值与其写入时间
     */
    public static List<InfluxQueryResult> queryRValues(String measurement, String deviceId) {
        // 构建Flux查询语句
        String fluxQuery = "from(bucket: \"" + BUCKET + "\")\n" +
                "  |> range(start: -10s, stop: now())\n" +  // 最近15秒
                "  |> filter(fn: (r) => r[\"_measurement\"] == \"" + measurement + "\")\n" +
                "  |> filter(fn: (r) => r[\"_field\"] == \"r\")\n" +
                "  |> filter(fn: (r) => r[\"id\"] == \"" + deviceId + "\")\n" +
                "  |> sort(columns: [\"_time\"], desc: true)\n" +  // 按时间降序排序（最新的在前）
                "  |> yield(name: \"results\")";  // 输出结果


        QueryApi queryApi = client.getQueryApi();
        List<FluxTable> tables = queryApi.query(fluxQuery, ORGANIZATION);

        List<InfluxQueryResult> results = new ArrayList<>();

        // 解析查询结果
        for (FluxTable table : tables) {
            for (FluxRecord record : table.getRecords()) {
                // 获取时间戳（毫秒级）和r值
                Instant time = record.getTime();
                int rValue = 0;
                Number rValueNum = (Number) record.getValueByKey("_value");
                if (rValueNum != null) {
                    rValue = rValueNum.intValue();
                }

                if (time != null && rValue != 0) {
                    results.add(new InfluxQueryResult(time, rValue));
                }
            }
        }

        return results;
    }

    // 关闭连接
    public static void close() {
        client.close();
    }

    public static void main(String[] args) {

        // 示例1：写入一条3天后过期的数据
        String measurement = "door_sign_log";
        Map<String, String> tags = Collections.singletonMap("id", "861921071791243");
        Map<String, Object> fields = Collections.singletonMap("value", 200);

        List<InfluxQueryResult> results = queryRValues(measurement, tags.get("id"));
        // 打印查询结果
        System.out.println("查询到 " + results.size() + " 条记录:");
        for (InfluxQueryResult result : results) {
            System.out.println("时间: " + result.getTime() + ", r值: " + result.getRValue());
        }
        // 关闭连接
        close();
    }
}