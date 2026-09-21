import struct
from crc16_modbus import calc_crc16_modbus

FRAME_HEADER = bytes([0xFF, 0x55])

def build_sampling_frame(
    point_code: int,
    lat: float,
    lon: float,
    soil_temp: int,
    soil_moist: int,
    air_temp: int,
    air_hum: int,
    soil_depth: int
) -> bytes:
    # 经纬度放大1e7，用int存储
    lat_scaled = int(lat * 10_000_000)
    lon_scaled = int(lon * 10_000_000)

    # >H i i B B B B B B
    # H:point_code(0~65535)
    # i:lat_scaled, i:lon_scaled
    # B:soil_temp, soil_moist, air_temp, air_hum, soil_depth, reserve
    payload_no_crc = struct.pack(
        ">HiiBBBBBB",
        point_code,
        lat_scaled,
        lon_scaled,
        soil_temp,
        soil_moist,
        air_temp,
        air_hum,
        soil_depth,
        0
    )
    full_body = FRAME_HEADER + payload_no_crc
    crc_val = calc_crc16_modbus(full_body)
    crc_bytes = struct.pack("<H", crc_val)
    return full_body + crc_bytes


if __name__ == "__main__":
    frame = build_sampling_frame(
        point_code=1,
        lat=37.8123456,
        lon=112.5678901,
        soil_temp=22,
        soil_moist=35,
        air_temp=25,
        air_hum=48,
        soil_depth=12
    )
    print(f"生成帧字节: {frame.hex()}")
    print(f"帧总长度={len(frame)}")
