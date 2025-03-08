# 实时聊天应用

这是一个基于WebSocket和WebRTC的实时聊天和视频通话应用。

## 功能特点

- 用户认证（登录/注册）
- 实时文字聊天
- 在线用户列表
- 一对一视频通话
- 音频/视频控制

## 技术栈

### 前端
- HTML5
- CSS3
- JavaScript (ES6+)
- WebSocket API
- WebRTC API
- Bootstrap 5

### 后端
- Java 11+
- Spring Boot
- Spring WebSocket
- Spring Security
- Spring Data JPA
- H2数据库（开发环境）

## 项目结构

```
.
├── backend/                # 后端代码
│   ├── src/               # 源代码目录
│   │   ├── main/         
│   │   │   ├── java/     # Java源代码
│   │   │   │   └── com/chatapp/
│   │   │   │       ├── config/      # 配置类
│   │   │   │       ├── controller/  # 控制器
│   │   │   │       ├── model/       # 数据模型
│   │   │   │       ├── repository/  # 数据访问
│   │   │   │       ├── service/     # 业务逻辑
│   │   │   │       └── websocket/   # WebSocket处理
│   │   │   └── resources/ # 资源文件
│   │   └── test/         # 测试代码
│   ├── pom.xml           # Maven配置文件
│   └── README.md         # 后端说明文档
│
├── frontend/              # 前端代码
│   ├── index.html         # 主HTML文件
│   ├── styles/            # CSS样式
│   │   └── main.css       # 主样式文件
│   ├── js/               # JavaScript文件
│   │   ├── app.js         # 主应用逻辑
│   │   ├── api.js         # API处理
│   │   ├── config.js      # 配置文件
│   │   ├── users.js       # 用户配置
│   │   ├── websocket.js   # WebSocket处理
│   │   └── webrtc.js      # WebRTC处理
│   ├── server.js          # 前端服务器
│   └── package.json       # npm配置文件
│
├── devbox.json            # Devbox配置文件
├── Dockerfile             # Docker构建文件
├── nginx.conf             # Nginx配置
├── sealos-devbox.yaml     # Sealos Devbox配置
├── start-services.sh      # 服务启动脚本
├── start.js               # 一键启动脚本（本地开发）
└── README.md              # 项目说明
```

## 安装与运行

### 本地开发环境

#### 后端

1. 确保已安装Java 11或更高版本和Maven

2. 进入后端目录：
   ```
   cd backend
   ```

3. 使用Maven编译项目：
   ```
   mvn clean package
   ```

4. 运行Spring Boot应用：
   ```
   java -jar target/realtime-chat-0.0.1-SNAPSHOT.jar
   ```

#### 前端

1. 确保已安装Node.js 14或更高版本

2. 进入前端目录：
   ```
   cd frontend
   ```

3. 安装依赖：
   ```
   npm install
   ```

4. 运行前端服务：
   ```
   npm start
   ```

#### 使用一键启动脚本

你可以使用项目根目录下的`start.js`脚本来同时启动前端和后端服务：

```bash
node start.js
```

这个脚本会：
1. 检查并编译后端项目（如果需要）
2. 启动Spring Boot后端服务
3. 等待5秒（确保后端启动完成）
4. 启动前端服务

### 使用Sealos Devbox部署

本项目支持使用Sealos.run平台的Devbox进行云端部署。

#### 前提条件

1. 注册Sealos.run账号
2. 安装Sealos CLI工具（可选）

#### 部署步骤

1. **使用Sealos控制台部署**

   a. 登录Sealos控制台
   b. 创建新的Devbox应用
   c. 上传或克隆本项目代码
   d. 在Devbox配置中使用`sealos-devbox.yaml`
   e. 点击部署按钮

2. **使用Sealos CLI部署**（可选）

   ```bash
   # 登录Sealos
   sealos login

   # 部署应用
   sealos apply -f sealos-devbox.yaml
   ```

3. **环境变量配置**

   部署时需要设置以下环境变量：
   - `ADMIN_PASSWORD`: 管理员密码
   - `JWT_SECRET`: JWT签名密钥
   - `APP_DOMAIN`: 应用域名（可选）

4. **访问应用**

   部署完成后，可以通过Sealos分配的域名访问应用。

## 使用说明

1. 注册/登录账号（目前只允许两个预设用户登录）
2. 查看在线用户列表
3. 点击用户旁边的视频图标发起视频通话
4. 使用聊天框发送消息
5. 在视频通话中可以控制音频/视频状态

## 浏览器兼容性

该应用使用了现代Web API，建议使用以下浏览器的最新版本：

- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

## 许可证

MIT