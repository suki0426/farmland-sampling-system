package com.jeeplus.teaching.integration.controller;

import com.jeeplus.aop.logging.annotation.ApiLog;
import com.jeeplus.teaching.integration.algorithm.SamplingAlgorithmService;
import com.jeeplus.teaching.integration.config.DeviceUdpProperties;
import com.jeeplus.teaching.integration.dto.DeviceLocationVO;
import com.jeeplus.teaching.integration.dto.DeviceTrackVO;
import com.jeeplus.teaching.integration.dto.GenerateSamplingPointDTO;
import com.jeeplus.teaching.integration.dto.RoutePlanDTO;
import com.jeeplus.teaching.integration.dto.RouteVO;
import com.jeeplus.teaching.integration.dto.SamplingPointVO;
import com.jeeplus.teaching.integration.dto.UdpStatusVO;
import com.jeeplus.teaching.integration.service.DeviceTelemetryService;
import com.jeeplus.teaching.integration.udp.UdpTelemetryReceiver;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 5号系统集成联调入口；不替代 A-D 的业务 Controller。
 */
@Api(tags = "农田采样系统集成")
@RestController
@RequestMapping("/integration")
public class FieldSamplingIntegrationController {

    private final DeviceTelemetryService telemetryService;
    private final SamplingAlgorithmService samplingAlgorithmService;
    private final ObjectProvider<UdpTelemetryReceiver> udpReceiverProvider;
    private final DeviceUdpProperties udpProperties;

    public FieldSamplingIntegrationController(DeviceTelemetryService telemetryService,
                                              SamplingAlgorithmService samplingAlgorithmService,
                                              ObjectProvider<UdpTelemetryReceiver> udpReceiverProvider,
                                              DeviceUdpProperties udpProperties) {
        this.telemetryService = telemetryService;
        this.samplingAlgorithmService = samplingAlgorithmService;
        this.udpReceiverProvider = udpReceiverProvider;
        this.udpProperties = udpProperties;
    }

    @ApiLog("查询设备实时位置")
    @ApiOperation("查询当前已接收设备的实时位置")
    @PreAuthorize("hasAuthority('integration:telemetry:list')")
    @GetMapping("/telemetry/realtime")
    public ResponseEntity<List<DeviceLocationVO>> realtime() {
        return ResponseEntity.ok(telemetryService.getLatestLocations());
    }

    @ApiLog("查询设备轨迹")
    @ApiOperation("查询内存中的最近设备轨迹")
    @PreAuthorize("hasAuthority('integration:telemetry:list')")
    @GetMapping("/telemetry/{deviceId}/track")
    public ResponseEntity<DeviceTrackVO> track(@PathVariable String deviceId,
                                                @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(telemetryService.getTrack(deviceId, Math.min(Math.max(1, limit), 1000)));
    }

    @ApiLog("查询 UDP 接收状态")
    @ApiOperation("查询农田采样 UDP 接收器状态和计数")
    @PreAuthorize("hasAuthority('integration:telemetry:list')")
    @GetMapping("/udp/status")
    public ResponseEntity<UdpStatusVO> udpStatus() {
        UdpTelemetryReceiver receiver = udpReceiverProvider.getIfAvailable();
        if (receiver != null) {
            return ResponseEntity.ok(receiver.getStatus());
        }
        UdpStatusVO status = new UdpStatusVO();
        status.setRunning(false);
        status.setPort(udpProperties.getPort());
        return ResponseEntity.ok(status);
    }

    @ApiLog("Mock 生成采样点")
    @ApiOperation("调用可替换的采样点算法适配器")
    @PreAuthorize("hasAuthority('integration:algorithm:execute')")
    @PostMapping("/sampling-points/generate")
    public ResponseEntity<List<SamplingPointVO>> generateSamplingPoints(
            @RequestBody GenerateSamplingPointDTO request) {
        return ResponseEntity.ok(samplingAlgorithmService.generateSamplingPoints(request));
    }

    @ApiLog("Mock 规划路线")
    @ApiOperation("调用可替换的路线规划算法适配器")
    @PreAuthorize("hasAuthority('integration:algorithm:execute')")
    @PostMapping("/routes/plan")
    public ResponseEntity<RouteVO> planRoute(@RequestBody RoutePlanDTO request) {
        return ResponseEntity.ok(samplingAlgorithmService.planRoute(request));
    }
}
