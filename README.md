# 实时聊天应用

基于 WebSocket 和 WebRTC 的实时聊天与视频通话应用。

## 功能特点

- 用户认证（JWT + Spring Security）
- 实时文字聊天（WebSocket STOMP）
- 一对一视频通话（WebRTC）
- 音频/视频控制
- 在线用户列表

## 技术栈

### 前端

- HTML5 / CSS3 / JavaScript (ES6+)
- Bootstrap 5
- 原生 WebSocket API
- WebRTC API
- Express 静态服务器 + http-proxy-middleware 代理

### 后端

- Java 17+
- Spring Boot 3.2
- Spring Security 6.x（JWT 无状态认证）
- Spring WebSocket（STOMP over SockJS）
- Spring Data JPA
- H2 数据库（开发环境）
- JWT 0.11.5

## 项目结构

```
.
├── backend/                          # 后端代码（Spring Boot）
│   ├── src/main/java/com/chatapp/
│   │   ├── RealtimeChatApplication.java    # 启动类
│   │   ├── config/
│   │   │   ├── SecurityConfig.java         # SecurityFilterChain 配置
│   │   │   ├── JwtAuthenticationFilter.java # JWT 认证过滤器
│   │   │   ├── WebSocketAuthInterceptor.java # WebSocket STOMP 认证拦截器
│   │   │   ├── WebSocketConfig.java         # WebSocket STOMP 端点 + 代理配置
│   │   │   ├── WebConfig.java               # CORS 配置
│   │   │   └── WebRTCConfig.java            # WebRTC ICE/视频参数配置
│   │   ├── controller/
│   │   │   ├── WebRTCSignalingController.java # WebRTC 信令（call/answer/ice/hangup）
│   │   │   └── LogController.java            # 前端错误日志上报
│   │   └── model/
│   │       └── WebRTCSignal.java            # 信令数据模型
│   ├── src/main/resources/
│   │   ├── application.properties           # 开发环境配置（默认激活）
│   │   ├── application-prod.properties      # 生产环境配置
│   │   ├── application.yml                  # WebRTC 参数配置
│   │   └── logback-spring.xml               # 日志配置
│   └── pom.xml
│
├── frontend/                         # 前端代码
│   ├── index.html                    # 主页面
│   ├── server.js                     # Express 服务器（含 API/WebSocket 代理）
│   ├── package.json
│   ├── js/
│   │   ├── app.js                    # 主应用逻辑（登录、聊天、视频控制）
│   │   ├── api.js                    # API 处理器（fetch 封装）
│   │   ├── config.js                 # 全局配置（URL、ICE、消息类型）
│   │   ├── websocket.js             # WebSocket 连接管理（含重连、消息路由）
│   │   ├── webrtc.js                # WebRTC 媒体流管理
│   │   └── users.js                 # 用户显示信息（仅 UI，无密码）
│   └── styles/
│       └── main.css
│
├── .env.example                      # 环境变量模板（复制为 .env 后修改）
├── .gitignore
├── start.js                          # 一键启动脚本（本地开发）
├── nginx.conf                        # Nginx 配置（生产部署）
├── devbox.json                       # Devbox 配置
├── devbox-start.sh                   # Devbox 启动脚本
├── sealos-devbox.yaml                # Sealos 部署配置
└── README.md
```

## 安全架构

### 认证流程

```
前端 → POST /api/auth/login → 后端验证 → 返回 JWT token
前端存储 token（localStorage）
后续请求携带 Authorization: Bearer <token>
WebSocket STOMP CONNECT 帧携带相同 token
```

### 安全组件

| 组件 | 职责 |
|------|------|
| `SecurityConfig` | SecurityFilterChain：`/api/**` 需认证，`/ws` 允许匿名握手 |
| `JwtAuthenticationFilter` | 从 HTTP Header 提取并验证 JWT，设置 SecurityContext |
| `WebSocketAuthInterceptor` | 从 STOMP CONNECT 帧提取 JWT，设置会话用户 |
| `WebConfig` | CORS 配置（明确来源，非通配符） |

### 已修复的安全问题

- 移除所有硬编码密钥和默认密码
- 客户端不再存储明文密码（认证完全由后端完成）
- XSS 防护：消息内容 HTML 转义后再插入 DOM
- H2 控制台禁止远程访问（`web-allow-others=false`）
- CORS 使用明确来源而非通配符（兼容 SockJS）
- `.env` 和敏感文件通过 `.gitignore` 排除

## 安装与运行

### 前置条件

- Java 17+
- Maven 3.9+
- Node.js 18+

### 本地开发

#### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，设置 DEVBOX_JWT_SECRET 等
```

#### 2. 启动后端

```bash
cd backend
mvn clean package -DskipTests
mvn spring-boot:run
# 或在 VS Code 中直接运行 RealtimeChatApplication
```

后端运行在 `http://localhost:8083`

#### 3. 启动前端

```bash
cd frontend
npm install
npm start
```

前端运行在 `http://localhost:3000`，API 和 WebSocket 请求自动代理到后端。

#### 4. 一键启动（推荐）

```bash
node start.js
```

自动完成：编译后端 → 启动后端 → 等待健康检查 → 启动前端。

### 环境变量参考

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DEVBOX_PORT` | 前端端口 | 3000 |
| `DEVBOX_SPRING_PROFILES_ACTIVE` | Spring profile | dev |
| `DEVBOX_JWT_SECRET` | JWT 签名密钥 | 必须设置 |
| `DEVBOX_ADMIN_USERNAME` | 管理员用户名 | admin |
| `DEVBOX_ADMIN_PASSWORD` | 管理员密码 | 必须设置 |
| `DEVBOX_ALLOWED_ORIGINS` | CORS 允许来源 | http://localhost:3000 |
| `DEVBOX_LOG_LEVEL` | 日志级别 | INFO |

### 生产部署（Sealos Devbox）

```bash
sealos apply -f sealos-devbox.yaml
```

生产环境必须设置：
- `JWT_SECRET`：32 字节以上随机字符串
- `ADMIN_PASSWORD`：强密码
- `ALLOWED_ORIGINS`：前端实际域名
- `APP_DOMAIN`：分配的域名

## API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | 否 | 用户登录，返回 JWT |
| POST | `/api/auth/register` | 否 | 用户注册 |
| GET | `/api/users/me` | 是 | 获取当前用户信息 |
| GET | `/api/users/online` | 是 | 获取在线用户列表 |
| GET | `/api/messages` | 是 | 获取聊天历史 |
| POST | `/api/logs/error` | 是 | 前端错误日志上报 |
| WS | `/ws` | 握手匿名 | WebSocket STOMP 端点 |

### WebSocket 消息目的地

| 方向 | 路径 | 说明 |
|------|------|------|
| 客户端发送 | `/app/chat` | 发送聊天消息 |
| 客户端发送 | `/app/join` | 加入聊天室（广播系统消息） |
| 客户端发送 | `/app/webrtc/call` | 发起视频通话 |
| 客户端发送 | `/app/webrtc/answer` | 应答通话 |
| 客户端发送 | `/app/webrtc/ice-candidate` | 交换 ICE 候选 |
| 客户端发送 | `/app/webrtc/hangup` | 挂断通话 |
| 服务端推送 | `/topic/public` | 公共聊天消息（广播） |
| 服务端推送 | `/queue/messages` | 私聊消息（点对点） |
| 服务端推送 | `/queue/webrtc/signal` | WebRTC 信令 |

## 浏览器兼容性

- Google Chrome（推荐）
- Mozilla Firefox
- Microsoft Edge
- Safari

## 许可证

MIT
