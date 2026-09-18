#!/usr/bin/env python3
"""5号本地联调工具：向 UDP 接收器发送三台 Mock 设备的 JSON 数据。"""

import argparse
import json
import socket
import time
from datetime import datetime


def main():
    parser = argparse.ArgumentParser(description="Send mock field-sampling UDP telemetry")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9000)
    parser.add_argument("--rounds", type=int, default=3)
    parser.add_argument("--interval", type=float, default=0.5)
    args = parser.parse_args()

    positions = [
        ("DEVICE_001", 112.123456, 37.123456),
        ("DEVICE_002", 112.124456, 37.124456),
        ("DEVICE_003", 112.125456, 37.125456),
    ]
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sender:
        for round_index in range(args.rounds):
            for sequence, (device_id, longitude, latitude) in enumerate(positions):
                payload = {
                    "deviceId": device_id,
                    "taskId": "MOCK-TASK-001",
                    "longitude": longitude + round_index * 0.00001,
                    "latitude": latitude + sequence * 0.00001,
                    "coordinateSystem": "WGS84",
                    "status": "MOCK_MOVING",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
                sender.sendto(json.dumps(payload).encode("utf-8"), (args.host, args.port))
                print("sent", payload["deviceId"], payload["longitude"], payload["latitude"])
            time.sleep(args.interval)


if __name__ == "__main__":
    main()
