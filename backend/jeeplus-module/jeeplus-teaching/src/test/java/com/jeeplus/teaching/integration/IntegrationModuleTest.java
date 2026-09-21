package com.jeeplus.teaching.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jeeplus.teaching.integration.config.DeviceUdpProperties;
import com.jeeplus.teaching.integration.dto.DeviceTelemetryDTO;
import com.jeeplus.teaching.integration.service.InMemoryDeviceTelemetryService;
import com.jeeplus.teaching.integration.udp.DeviceTelemetryValidator;
import com.jeeplus.teaching.integration.udp.JsonDeviceMessageDecoder;
import com.jeeplus.teaching.integration.udp.UdpTelemetryReceiver;
import org.junit.Assert;
import org.junit.Test;

import java.math.BigDecimal;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;

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

    private void waitForAccepted(UdpTelemetryReceiver receiver) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 1000L;
        while (receiver.getStatus().getAcceptedCount() == 0 && System.currentTimeMillis() < deadline) {
            Thread.sleep(20L);
        }
        Assert.assertEquals(1L, receiver.getStatus().getAcceptedCount());
    }
}
