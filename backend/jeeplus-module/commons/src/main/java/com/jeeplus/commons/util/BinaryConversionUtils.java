package com.jeeplus.commons.util;

/**
 * 数据转化为二进制字符串数组
 *
 * @auther 高靖奇
 * @date 2025/8/14
 */
public class BinaryConversionUtils {

    /**
     * 将 byte 类型的十进制数字转换为4位二进制字符串的数组
     *
     * @param num 输入的 byte 类型十进制数字（范围 0-15，4位二进制最多表示15）
     * @return 4位二进制数组（如 3 → ["0", "0", "1", "1"]）
     * @throws IllegalArgumentException 如果数字超出4位二进制范围（<0 或 >15）
     */
    public static String[] decimalTo4BitBinaryArray(byte num) {
        // 先将 byte 类型转换为 int 类型进行范围检查
        int intNum = num & 0xFF;
        if (intNum < 0 || intNum > 15) {
            throw new IllegalArgumentException("输入数字必须为 0-15（4位二进制范围）");
        }
        // 转换为4位二进制字符串（补前导0）
        String binaryString = String.format("%4s", Integer.toBinaryString(intNum)).replace(' ', '0');
        // 分割成字符数组，再转换为字符串数组
        String[] result = new String[4];
        for (int i = 0; i < 4; i++) {
            result[i] = String.valueOf(binaryString.charAt(i));
        }
        return result;
    }

    /**
     * 将 byte 类型数字转换为 6位二进制字符串数组
     *
     * 输入范围限制：0-63（6位二进制的取值范围）
     * @param num 输入的 byte 数字（实际有效范围 0-63）
     * @return 长度为6的字符串数组，每个元素对应一位二进制数（高位在前）
     * @throws IllegalArgumentException 当输入数字超出 0-63 范围时抛出
     */
    public static String[] decimalTo7BitBinaryArray(byte num) {
        // 将 byte 转换为 int 并保留低8位（避免负数符号扩展影响）
        int intNum = num & 0xFF;

        // 检查是否在 6位二进制范围内（0-63）
        if (intNum < 0 || intNum > 63) {
            throw new IllegalArgumentException("输入数字必须为 0-63（6位二进制范围）");
        }

        // 转换为6位二进制字符串，不足6位补前导0
        // %6s 表示占6个字符宽度，空格填充，再用0替换空格
        String binaryString = String.format("%6s", Integer.toBinaryString(intNum)).replace(' ', '0');

        // 分割为单个字符，转换为字符串数组（长度固定为6）
        String[] result = new String[6];
        for (int i = 0; i < 6; i++) {
            result[i] = String.valueOf(binaryString.charAt(i));
        }

        return result;
    }

    /**
     * 将 long 类型的十进制数字转换为4位二进制字符串的数组
     *
     * @param num 输入的 long 类型十进制数字（范围 0-15，4位二进制最多表示15）
     * @return 4位二进制数组（如 3 → ["0", "0", "1", "1"]）
     * @throws IllegalArgumentException 如果数字超出4位二进制范围（<0 或 >15）
     */
    public static String[] decimalTo4BitBinaryArray(long num) {
        // 检查范围是否在0-15之间
        if (num < 0 || num > 15) {
            throw new IllegalArgumentException("输入数字必须为 0-15（4位二进制范围）");
        }
        // 转换为4位二进制字符串（补前导0）
        String binaryString = String.format("%4s", Long.toBinaryString(num)).replace(' ', '0');
        // 分割成字符数组，再转换为字符串数组
        String[] result = new String[4];
        for (int i = 0; i < 4; i++) {
            result[i] = String.valueOf(binaryString.charAt(i));
        }
        return result;
    }

    /**
     * 将 long 类型的十进制数字转换为7位二进制字符串的数组
     *
     * @param num 输入的 long 类型十进制数字（范围 0-127，7位二进制最多表示127）
     * @return 7位二进制数组
     * @throws IllegalArgumentException 如果数字超出6位二进制范围（<0 或 >127）
     */
    public static String[] decimalTo7BitBinaryArray(long num) {
        // 检查范围是否在0-127之间（7位二进制最大为 11111111 = 127）
        if (num < 0 || num > 127) {
            throw new IllegalArgumentException("输入数字必须为 0-127（7位二进制范围）");
        }
        // 转换为7位二进制字符串（不足7位补前导0）
        String binaryString = String.format("%7s", Long.toBinaryString(num)).replace(' ', '0');
        // 分割成字符数组，再转换为字符串数组（长度固定为6）
        String[] result = new String[7];
        for (int i = 0; i < 7; i++) {
            result[i] = String.valueOf(binaryString.charAt(i));
        }
        return result;
    }
}
