#!/bin/bash

# Devbox环境启动脚本
echo "正在启动实时聊天应用..."

# 创建必要的目录
mkdir -p ./logs
mkdir -p ./data

# 加载环境变量
if [ -f .env ]; then
  echo "加载环境变量..."
  export $(grep -v '^#' .env | xargs)
fi

# 设置默认环境变量
export SPRING_PROFILES_ACTIVE=${DEVBOX_SPRING_PROFILES_ACTIVE:-prod}
export NODE_ENV=${DEVBOX_NODE_ENV:-production}

# 映射Devbox前缀的环境变量到Spring Boot需要的变量
export ADMIN_USERNAME=${DEVBOX_ADMIN_USERNAME:-admin}
export ADMIN_PASSWORD=${DEVBOX_ADMIN_PASSWORD:-password}
export JWT_SECRET=${DEVBOX_JWT_SECRET:-default_jwt_secret}
export ALLOWED_ORIGINS=${DEVBOX_ALLOWED_ORIGINS:-*}

# 启动后端服务
echo "正在启动后端服务..."
cd backend
java -jar target/realtime-chat-0.0.1-SNAPSHOT.jar > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..

# 等待后端健康检查
echo "等待后端服务启动..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
  if curl -s http://localhost:8083/actuator/health | grep -q "UP"; then
    echo "后端服务已成功启动"
    break
  fi
  echo "等待后端服务启动... 尝试 $attempt/$max_attempts"
  sleep 2
  attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
  echo "后端服务启动失败"
  exit 1
fi

# 启动前端服务
echo "正在启动前端服务..."
cd frontend
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
cd ..

echo "应用已成功启动!"
echo "前端服务运行在: http://localhost:${DEVBOX_PORT:-3000}"
echo "后端API运行在: http://localhost:8083"
echo "WebSocket端点: ws://localhost:8083/ws"

# 保持脚本运行
wait