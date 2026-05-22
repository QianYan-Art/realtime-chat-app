# 实时聊天应用

基于 WebSocket 和 WebRTC 的实时聊天与视频通话应用。

## 功能特点

- 用户认证（JWT + Spring Security 6.x）
- 实时文字聊天（WebSocket STOMP 协议）
- 一对一视频通话（WebRTC + 信令服务器）
- 音频/视频控制
- 系统加入/离开通知

## 技术栈

### 前端

- HTML5 / CSS3 / JavaScript (ES6+)
- Bootstrap 5
- 原生 WebSocket API（自定义 STOMP 帧封装）
- WebRTC API
- Express 静态服务器 + http-proxy-middleware（API 代理）

### 后端

- Java 17+
- Spring Boot 3.2.3
- Spring Security 6.x（JWT 无状态认证）
- Spring WebSocket（STOMP，原生 WebSocket，无 SockJS）
- Spring Data JPA
- H2 内存数据库（开发环境）
- JWT 0.11.5
- Spring Boot Actuator（健康检查）

## 项目结构

```
.
├── backend/                               # 后端代码（Spring Boot）
│   ├── src/main/java/com/chatapp/
│   │   ├── RealtimeChatApplication.java         # 启动类
│   │   ├── config/
│   │   │   ├── SecurityConfig.java              # SecurityFilterChain 配置
│   │   │   ├── JwtAuthenticationFilter.java     # JWT 认证过滤器
│   │   │   ├── WebSocketAuthInterceptor.java    # WebSocket STOMP 认证拦截器
│   │   │   ├── WebSocketConfig.java             # WebSocket STOMP 端点配置
│   │   │   ├── WebConfig.java                   # CORS 配置
│   │   │   └── WebRTCConfig.java                # WebRTC ICE/视频参数配置
│   │   ├── controller/
│   │   │   ├── AuthController.java              # 登录/注册 API
│   │   │   ├── ChatController.java              # 聊天消息处理 + 加入通知
│   │   │   ├── WebRTCSignalingController.java   # WebRTC 信令转发
│   │   │   └── LogController.java               # 前端错误日志上报
│   │   └── model/
│   │       ├── ChatMessage.java                 # 聊天消息模型
│   │       └── WebRTCSignal.java                # WebRTC 信令模型
│   ├── src/main/resources/
│   │   ├── application.properties               # 开发环境配置
│   │   ├── application-prod.properties          # 生产环境配置
│   │   ├── application.yml                      # WebRTC 参数配置
│   │   └── logback-spring.xml                   # 日志配置
│   └── pom.xml
│
├── frontend/                              # 前端代码
│   ├── index.html                         # 主页面
│   ├── server.js                          # Express 服务器（API 代理）
│   ├── package.json
│   ├── js/
│   │   ├── app.js                         # 主应用逻辑（登录、聊天、视频控制）
│   │   ├── api.js                         # API 处理器（fetch 封装 + JWT）
│   │   ├── config.js                      # 全局配置（URL、ICE、消息类型）
│   │   ├── websocket.js                  # WebSocket + STOMP 帧封装（含重连）
│   │   ├── webrtc.js                     # WebRTC 媒体流 + 信令管理
│   │   └── users.js                      # 用户显示信息（仅 UI）
│   └── styles/
│       └── main.css
│
├── .env.example                           # 环境变量模板
├── .gitignore
├── start.js                               # 一键启动脚本（本地开发）
├── nginx.conf                             # Nginx 配置（生产部署）
├── devbox.json                            # Devbox 配置
├── devbox-start.sh                        # Devbox 启动脚本
├── sealos-devbox.yaml                     # Sealos 部署配置
└── README.md
```

## 安全架构

### 认证流程

```
1. 前端 → POST /api/auth/login → 后端验证 → 返回 JWT token
2. 前端存储 token（localStorage）
3. HTTP 请求携带 Authorization: Bearer <token>
4. WebSocket CONNECT 帧携带 Authorization: Bearer <token>
5. 后端 JwtAuthenticationFilter 验证 HTTP 请求
6. 后端 WebSocketAuthInterceptor 验证 STOMP CONNECT 帧
```

### 安全组件

| 组件 | 职责 |
|------|------|
| `SecurityConfig` | SecurityFilterChain：`/api/auth/**` 放行，`/api/**` 需认证，`/ws` 放行 |
| `JwtAuthenticationFilter` | 从 HTTP Header 提取并验证 JWT，设置 SecurityContext |
| `WebSocketAuthInterceptor` | 从 STOMP CONNECT 帧提取 JWT，设置会话用户；拦截未认证的 SUBSCRIBE/SEND |
| `WebConfig` | CORS 配置（明确来源，非通配符，allowCredentials） |

### 安全措施

- 无硬编码密钥（开发环境使用 application.properties 中的默认值，生产环境必须通过环境变量覆盖）
- 客户端不存储明文密码（认证完全由后端完成）
- XSS 防护：消息内容 HTML 转义后再插入 DOM
- H2 控制台禁止远程访问（`web-allow-others=false`）
- CORS 使用明确来源（`http://localhost:3000`）而非通配符
- httpBasic 显式禁用（仅使用 JWT 认证）
- `.env` 和敏感文件通过 `.gitignore` 排除

## 安装与运行

### 前置条件

- Java 17+
- Maven 3.9+
- Node.js 18+

### 本地开发

#### 1. 启动后端

```bash
cd backend
mvn clean package -DskipTests
mvn spring-boot:run
```

后端运行在 `http://localhost:8083`

#### 2. 启动前端

```bash
cd frontend
npm install
npm start
```

前端运行在 `http://localhost:3000`。

> **注意**：前端 API 请求通过 Express 代理转发到后端（`/api` → `localhost:8083`），WebSocket 直连后端（`ws://localhost:8083/ws`）。

#### 3. 一键启动（推荐）

```bash
node start.js
```

自动完成：编译后端 → 启动后端 → 等待健康检查 → 启动前端。

### 默认测试账号

| 用户名 | 密码 |
|--------|------|
| admin  | admin123 |
| user   | user123 |

也可通过注册接口创建新账号。

### 环境变量参考

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DEVBOX_PORT` | 前端端口 | 3000 |
| `DEVBOX_SPRING_PROFILES_ACTIVE` | Spring profile | dev |
| `DEVBOX_JWT_SECRET` | JWT 签名密钥（32字节以上） | dev_jwt_secret_key_change_in_production... |
| `DEVBOX_ADMIN_USERNAME` | 管理员用户名 | admin |
| `DEVBOX_ADMIN_PASSWORD` | 管理员密码 | admin123 |
| `DEVBOX_ALLOWED_ORIGINS` | CORS 允许来源 | http://localhost:3000,http://localhost:5173 |
| `DEVBOX_LOG_LEVEL` | 日志级别 | INFO |

## API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | 否 | 用户登录，返回 JWT token |
| POST | `/api/auth/register` | 否 | 用户注册（用户名≥3字符，密码≥6字符） |
| POST | `/api/logs/error` | 是 | 前端错误日志上报（返回 204） |
| GET | `/actuator/health` | 否 | 健康检查 |
| WS | `/ws` | CONNECT 帧携带 token | WebSocket STOMP 端点 |

### WebSocket STOMP 消息目的地

| 方向 | 路径 | 说明 |
|------|------|------|
| 客户端发送 | `/app/chat` | 发送聊天消息（广播或私聊） |
| 客户端发送 | `/app/join` | 加入聊天室（广播系统通知） |
| 客户端发送 | `/app/webrtc/call` | 发起视频通话 |
| 客户端发送 | `/app/webrtc/answer` | 应答视频通话 |
| 客户端发送 | `/app/webrtc/ice-candidate` | 交换 ICE 候选 |
| 客户端发送 | `/app/webrtc/hangup` | 挂断通话 |
| 服务端推送 | `/topic/public` | 公共聊天消息（广播） |
| 服务端推送 | `/queue/messages` | 私聊消息（点对点） |
| 服务端推送 | `/queue/webrtc/signal` | WebRTC 信令 |

## 运行截图

登录后进入聊天界面，支持：
- 实时文字聊天（消息广播给所有在线用户）
- 系统加入/离开通知
- 本地视频预览（点击"开始视频"）
- 发起视频通话（需要目标用户名）

## 浏览器兼容性

- Google Chrome（推荐）
- Mozilla Firefox
- Microsoft Edge
- Safari

## 许可证

MIT
