# Docker 开发运行（orchestrator）

本目录用于本地开发时快速重启 Rust 引擎容器。

## 目录

- `Dockerfile.orchestrator`：Rust 运行镜像
- `docker-compose.yml`：开发编排

## 启动

在仓库根目录执行：

```powershell
docker compose -f docker/docker-compose.yml up -d --build
```

## 查看日志

```powershell
docker compose -f docker/docker-compose.yml logs -f orchestrator
```

## 代码改动后重启

```powershell
docker compose -f docker/docker-compose.yml restart orchestrator
```

> 由于容器命令是 `cargo run -p orchestrator`，重启后会重新编译并运行最新代码。

## 停止

```powershell
docker compose -f docker/docker-compose.yml down
```

## 注意

- VS Code 扩展如果要连接容器内引擎，建议后续改为 TCP/WebSocket 方式。
- 当前扩展默认通过本地 stdio 启动 `orchestrator.exe`，和 Docker 容器是两条路径。
