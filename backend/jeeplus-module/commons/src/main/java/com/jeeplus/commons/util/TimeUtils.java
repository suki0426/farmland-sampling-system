package com.jeeplus.commons.util;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

/**
 * @auther 高靖奇
 * @date 2025/6/30
 */
public class TimeUtils {

    private static final ZoneId DEFAULT_ZONE_ID = ZoneId.systemDefault();

    /**
     * 将时间字符串转为 13 位时间戳（毫秒级）
     * @param timeStr 时间字符串（格式需明确，如 "yyyy-MM-dd HH:mm:ss"）
     */
    public static long parseTimeToMillis(String timeStr, String pattern) throws ParseException {
        SimpleDateFormat sdf = new SimpleDateFormat(pattern);
        Date date = sdf.parse(timeStr);
        return date.getTime(); // 直接返回 13 位时间戳
    }

    /**
     * 校验开始时间是否小于结束时间
     */
    public static void validateTimeRange(long startTime, long endTime) throws IllegalArgumentException {
        if (startTime >= endTime) {
            throw new IllegalArgumentException("开始时间必须小于结束时间");
        }

        LocalDate startDate = Instant.ofEpochMilli(startTime).atZone(DEFAULT_ZONE_ID).toLocalDate();
        LocalDate endDate = Instant.ofEpochMilli(endTime).atZone(DEFAULT_ZONE_ID).toLocalDate();

        if (!startDate.equals(endDate)) {
            throw new IllegalArgumentException("开始时间和结束时间必须在同一天内，开始日期：" + startDate + "，结束日期：" + endDate);
        }
    }
}
