package com.jeeplus.common.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * @auther 高靖奇
 * @date 2025/10/10
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InfluxQueryResult {
    private Instant time;  // 写入时间
    private Integer rValue; // r字段的值

    /**
     * 将r值取整数位并转换为4位二进制字符串数组
     * @return 长度为4的String数组，每个元素为单个二进制位（"0"或"1"）
     * 例如：1 → ["0", "0", "0", "1"]，7 → ["0", "1", "1", "1"]
     */
    public String[] getRValueAs4BitBinaryArray() {
        // 先获取4位二进制字符串
        String binaryStr = getRValueAs4BitBinary();

        // 拆分为单个字符并转换为String数组
        String[] binaryArray = new String[4];
        for (int i = 0; i < 4; i++) {
            binaryArray[i] = String.valueOf(binaryStr.charAt(i));
        }
        return binaryArray;
    }

    /**
     * 辅助方法：获取4位二进制字符串
     */
    private String getRValueAs4BitBinary() {
        if (rValue == null) {
            return "0000";
        }

        int intValue = (int) Math.floor(rValue);
        int clampedValue = Math.max(0, Math.min(15, intValue));
        return String.format("%4s", Integer.toBinaryString(clampedValue))
                .replace(' ', '0');
    }
}
