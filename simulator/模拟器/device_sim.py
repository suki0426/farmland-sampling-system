import socket
import time
import random
import logging
from frame_builder import build_sampling_frame
from nmea_generator import make_gga, make_rmc

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

CFG = {
    "udp": {
        "target_host": "127.0.0.1",
        "target_port": 9000,
        "send_interval_ms": 800
    },
    "simulator": {
        "devices": [
            {"dev_code": "DEV001", "start_lat": 37.8100, "start_lon": 112.5600},
            {"dev_code": "DEV002", "start_lat": 37.8130, "start_lon": 112.5630},
            {"dev_code": "DEV003", "start_lat": 37.8160, "start_lon": 112.5660},
        ],
        "max_total_frames": 200,
        "enable_abnormal": True
    }
}


class SamplingDevice:
    def __init__(self, dev_code, lat0, lon0):
        self.dev_code = dev_code
        self.lat = lat0
        self.lon = lon0
        self.dlat_step = 0.000015
        self.dlon_step = 0.000020
        self.direction = random.choice([-1, 1])

    def move(self):
        self.lat += self.dlat_step * self.direction
        self.lon += self.dlon_step * self.direction
        if random.random() < 0.03:
            self.direction *= -1

    def get_sensor(self, is_abnormal=False):
        if is_abnormal:
            return {
                "soil_temp": 255,
                "soil_moist": 255,
                "air_temp": 255,
                "air_hum": 255,
                "soil_depth": 255
            }
        return {
            "soil_temp": random.randint(18, 28),
            "soil_moist": random.randint(20, 50),
            "air_temp": random.randint(20, 30),
            "air_hum": random.randint(30, 65),
            "soil_depth": random.randint(8, 20)
        }


def main():
    cfg = CFG
    host = cfg["udp"]["target_host"]
    port = cfg["udp"]["target_port"]
    interval_s = cfg["udp"]["send_interval_ms"] / 1000.0
    max_frames = cfg["simulator"]["max_total_frames"]
    enable_abnormal = cfg["simulator"]["enable_abnormal"]

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    devices = []
    for d_cfg in cfg["simulator"]["devices"]:
        dev = SamplingDevice(
            dev_code=d_cfg["dev_code"],
            lat0=d_cfg["start_lat"],
            lon0=d_cfg["start_lon"]
        )
        devices.append(dev)

    sent_count = 0
    logging.info(f"模拟器启动，目标 {host}:{port}，最大报文数{max_frames}")

    while sent_count < max_frames:
        for dev in devices:
            dev.move()
            point_code = sent_count % 65535
            is_abn = enable_abnormal and (random.random() < 0.05)
            sensor = dev.get_sensor(is_abnormal=is_abn)

            frame = build_sampling_frame(
                device_id=dev.dev_code,
                point_code=point_code,
                lat=dev.lat,
                lon=dev.lon,
                soil_temp=sensor["soil_temp"],
                soil_moist=sensor["soil_moist"],
                air_temp=sensor["air_temp"],
                air_hum=sensor["air_hum"],
                soil_depth=sensor["soil_depth"]
            )
            sock.sendto(frame, (host, port))

            nmea_gga = make_gga(dev.lat, dev.lon).strip()
            nmea_rmc = make_rmc(dev.lat, dev.lon).strip()
            logging.info(
                f"[{dev.dev_code}] send frame hex={frame.hex()[:60]}..., "
                f"lat={dev.lat:.7f} lon={dev.lon:.7f} abnormal={is_abn}"
            )
            logging.debug(f"NMEA GGA: {nmea_gga}")
            logging.debug(f"NMEA RMC: {nmea_rmc}")

            sent_count += 1
            if sent_count >= max_frames:
                break
        time.sleep(interval_s)

    logging.info(f"模拟器完成，总共发送 {sent_count} 条报文")
    sock.close()


if __name__ == "__main__":
    main()
