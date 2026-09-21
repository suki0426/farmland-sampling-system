package com.jeeplus.teaching.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jeeplus.teaching.integration.config.DeviceUdpProperties;
import com.jeeplus.teaching.integration.dto.DeviceTelemetryDTO;
import com.jeeplus.teaching.integration.service.InMemoryDeviceTelemetryService;
import com.jeeplus.teaching.integration.udp.DeviceTelemetryValidator;
import com.jeeplus.teaching.integration.udp.AutoDeviceMessageDecoder;
import com.jeeplus.teaching.integration.udp.JsonDeviceMessageDecoder;
import com.jeeplus.teaching.integration.udp.SamplingBinaryMessageDecoder;
import com.jeeplus.teaching.integration.udp.UdpTelemetryReceiver;
import org.junit.Assert;
import org.junit.Test;

import java.math.BigDecimal;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.nio.ByteBuffer;

public class IntegrationModuleTest {

    @Test
    public void jsonDecoderValidatorAndInMemoryTrackWorkTogether() {
        JsonDeviceMessageDecoder decoder = new JsonDeviceMessageDecoder(new ObjectMapper());
        DeviceTelemetryValidator validator = new DeviceTelemetryValidator();
        DeviceTelemetryDTO telemetry = decoder.decode((
                "{\"device_id\":\"DEVICE_001\",\"longitude\":112.123456,"
                        + "\"latitude\":37.123456,\"timestamp\":\"2026-09-18 10:30:00\"}").getBytes());
        validator.validate(telemetry);

        DeviceUdpProperties properties = new DeviceUdpProperties();
        properties.setMaxTrackSize(2);
        InMemoryDeviceTelemetryService service = new InMemoryDeviceTelemetryService(properties);
        service.save(telemetry);
        telemetry.setLongitude(new BigDecimal("112.123457"));
        service.save(telemetry);

        Assert.assertEquals(1, service.getLatestLocations().size());
        Assert.assertEquals(2, service.getTrack("DEVICE_001", 10).getPoints().size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void illegalLongitudeIsRejected() {
        DeviceTelemetryDTO telemetry = new DeviceTelemetryDTO();
        telemetry.setDeviceId("DEVICE_001");
        telemetry.setLongitude(new BigDecimal("999"));
        telemetry.setLatitude(new BigDecimal("37"));
        telemetry.setTimestamp("2026-09-18 10:30:00");
        new DeviceTelemetryValidator().validate(telemetry);
    }

    @Test
    public void udpReceiverAcceptsValidPacketAndSurvivesInvalidPacket() throws Exception {
        DeviceUdpProperties properties = new DeviceUdpProperties();
        properties.setPort(0);
        InMemoryDeviceTelemetryService service = new InMemoryDeviceTelemetryService(properties);
        UdpTelemetryReceiver receiver = new UdpTelemetryReceiver(properties,
                new JsonDeviceMessageDecoder(new ObjectMapper()), new DeviceTelemetryValidator(), service);
        receiver.start();
        try {
            send(receiver.getStatus().getPort(),
                    "{\"deviceId\":\"DEVICE_002\",\"longitude\":112.12,\"latitude\":37.12,"
                            + "\"timestamp\":\"2026-09-18 10:30:00\"}");
            waitForAccepted(receiver);
            Assert.assertEquals(1, service.getLatestLocations().size());

            send(receiver.getStatus().getPort(), "{not-json}");
            long deadline = System.currentTimeMillis() + 1000L;
            while (receiver.getStatus().getRejectedCount() == 0 && System.currentTimeMillis() < deadline) {
                Thread.sleep(20L);
            }
            Assert.assertEquals(1L, receiver.getStatus().getRejectedCount());
            Assert.assertTrue(receiver.isRunning());
        } finally {
            receiver.stop();
        }
    }

    @Test
    public void binarySamplingFrameIsDecodedAndAcceptedByAutoDecoder() throws Exception {
        SamplingBinaryMessageDecoder binaryDecoder = new SamplingBinaryMessageDecoder();
        DeviceTelemetryDTO telemetry = binaryDecoder.decode(binaryFrame("DEV003", 37.8123456, 112.5678901));
        Assert.assertEquals("DEV003", telemetry.getDeviceId());
        Assert.assertEquals(new BigDecimal("37.8123456"), telemetry.getLatitude());
        Assert.assertEquals(new BigDecimal("112.5678901"), telemetry.getLongitude());
        Assert.assertEquals("WGS84", telemetry.getCoordinateSystem());

        DeviceUdpProperties properties = new DeviceUdpProperties();
        properties.setPort(0);
        InMemoryDeviceTelemetryService service = new InMemoryDeviceTelemetryService(properties);
        UdpTelemetryReceiver receiver = new UdpTelemetryReceiver(properties,
                new AutoDeviceMessageDecoder(new JsonDeviceMessageDecoder(new ObjectMapper()), binaryDecoder),
                new DeviceTelemetryValidator(), service);
        receiver.start();
        try {
            send(receiver.getStatus().getPort(), binaryFrame("DEV003", 37.8123456, 112.5678901));
            waitForAccepted(receiver);
            Assert.assertEquals(1, service.getLatestLocations().size());
        } finally {
            receiver.stop();
        }
    }

    private void send(int port, String payload) throws Exception {
        byte[] bytes = payload.getBytes(StandardCharsets.UTF_8);
        DatagramPacket packet = new DatagramPacket(bytes, bytes.length,
                InetAddress.getByName("127.0.0.1"), port);
        DatagramSocket sender = new DatagramSocket();
        try {
            sender.send(packet);
        } finally {
            sender.close();
        }
    }

    private void send(int port, byte[] payload) throws Exception {
        DatagramPacket packet = new DatagramPacket(payload, payload.length,
                InetAddress.getByName("127.0.0.1"), port);
        DatagramSocket sender = new DatagramSocket();
        try {
            sender.send(packet);
        } finally {
            sender.close();
        }
    }

    private byte[] binaryFrame(String deviceId, double latitude, double longitude) {
        ByteBuffer buffer = ByteBuffer.allocate(36);
        buffer.put((byte) 0xFF).put((byte) 0x55);
        buffer.putShort((short) 1);
        buffer.putInt((int) (latitude * 10000000));
        buffer.putInt((int) (longitude * 10000000));
        buffer.put(new byte[] {22, 35, 25, 48, 12, 0});
        byte[] deviceBytes = deviceId.getBytes(StandardCharsets.US_ASCII);
        buffer.put(deviceBytes);
        buffer.put(new byte[16 - deviceBytes.length]);
        byte[] frame = buffer.array();
        int crc = crc16Modbus(frame, frame.length - 2);
        frame[frame.length - 2] = (byte) crc;
        frame[frame.length - 1] = (byte) (crc >>> 8);
        return frame;
    }

    private int crc16Modbus(byte[] data, int length) {
        int crc = 0xFFFF;
        for (int index = 0; index < length; index++) {
            crc ^= data[index] & 0xFF;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 1) != 0 ? (crc >>> 1) ^ 0xA001 : crc >>> 1;
            }
        }
        return crc & 0xFFFF;
    }

    private void waitForAccepted(UdpTelemetryReceiver receiver) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 1000L;
        while (receiver.getStatus().getAcceptedCount() == 0 && System.currentTimeMillis() < deadline) {
            Thread.sleep(20L);
        }
        Assert.assertEquals(1L, receiver.getStatus().getAcceptedCount());
    }
}
