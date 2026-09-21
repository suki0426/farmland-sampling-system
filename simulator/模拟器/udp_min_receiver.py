import socket

def main():
    listen_port = 8888
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", listen_port))
    print(f"最小测试接收端监听0.0.0.0:{listen_port}，Ctrl‑C退出")
    while True:
        data, addr = sock.recvfrom(1024)
        print(f"\nRecv from {addr}, len={len(data)}, hex={data.hex()}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nstop")
