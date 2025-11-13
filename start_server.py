#!/usr/bin/env python3
import http.server
import socketserver
import os

# 设置端口号
PORT = 8000

# 获取当前目录
current_dir = os.getcwd()
print(f"当前目录: {current_dir}")

# 创建处理器
Handler = http.server.SimpleHTTPRequestHandler

# 创建服务器
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"服务器运行在 http://localhost:{PORT}/")
    print("按 Ctrl+C 停止服务器")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")