import time

def calc_nmea_checksum(s: str) -> str:
    cksum = 0
    for ch in s:
        cksum ^= ord(ch)
    return f"{cksum:02X}"

def deg_to_nmea(decimal_deg: float, is_lat: bool):
    sign = "+"
    if decimal_deg < 0:
        sign = "-"
        decimal_deg = -decimal_deg
    deg = int(decimal_deg)
    minute = (decimal_deg - deg) * 60
    if is_lat:
        return f"{deg:02d}{minute:08.4f}", 'N' if sign == "+" else 'S'
    else:
        return f"{deg:03d}{minute:08.4f}", 'E' if sign == "+" else 'W'

def make_gga(lat: float, lon: float) -> str:
    t = time.gmtime()
    time_str = f"{t.tm_hour:02d}{t.tm_min:02d}{t.tm_sec:02d}.000"
    lat_str, lat_dir = deg_to_nmea(lat, True)
    lon_str, lon_dir = deg_to_nmea(lon, False)
    body = f"GPGGA,{time_str},{lat_str},{lat_dir},{lon_str},{lon_dir},1,08,1.0,100.0,M,0.0,M,,"
    cs = calc_nmea_checksum(body)
    return f"${body}*{cs}\r\n"

def make_rmc(lat: float, lon: float, speed_knot=0.0) -> str:
    t = time.gmtime()
    time_str = f"{t.tm_hour:02d}{t.tm_min:02d}{t.tm_sec:02d}.000"
    lat_str, lat_dir = deg_to_nmea(lat, True)
    lon_str, lon_dir = deg_to_nmea(lon, False)
    date_str = f"{t.tm_mday:02d}{t.tm_mon:02d}{str(t.tm_year)[2:]}"
    body = f"GPRMC,{time_str},A,{lat_str},{lat_dir},{lon_str},{lon_dir},{speed_knot:.2f},0.0,{date_str},,,A"
    cs = calc_nmea_checksum(body)
    return f"${body}*{cs}\r\n"


if __name__ == "__main__":
    print(make_gga(37.8123456, 112.5678901))
    print(make_rmc(37.8123456, 112.5678901))
