const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

// 设置工作目录
const projectRoot = __dirname;
const backendDir = path.join(projectRoot, 'backend');
const frontendDir = path.join(projectRoot, 'frontend');

// 创建日志目录
const logsDir = path.join(projectRoot, 'logs');
if (!existsSync(logsDir)) {
    require('fs').mkdirSync(logsDir, { recursive: true });
}

// 加载环境变量
require('dotenv').config();

// 启动后端服务
console.log('正在启动后端服务...');
const backend = spawn('java', [
    '-jar',
    'target/realtime-chat-0.0.1-SNAPSHOT.jar'
], {
    cwd: backendDir,
    stdio: 'pipe'
});

// 将后端输出重定向到日志文件
const backendLog = require('fs').createWriteStream(path.join(logsDir, 'backend.log'));
backend.stdout.pipe(backendLog);
backend.stderr.pipe(backendLog);

// 等待后端健康检查
console.log('等待后端服务启动...');
const waitForBackend = async () => {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch('http://localhost:8083/actuator/health');
            const data = await response.json();
            if (data.status === 'UP') {
                console.log('后端服务已成功启动');
                return true;
            }
        } catch (e) {
            // 忽略错误，继续等待
        }
        console.log(`等待后端服务启动... 尝试 ${i + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return false;
};

// 启动前端服务
const startFrontend = () => {
    console.log('正在启动前端服务...');
    // 使用process.execPath获取当前Node.js可执行文件的路径
    const frontend = spawn(process.execPath, [path.join(frontendDir, 'server.js')], {
        cwd: frontendDir,
        stdio: 'pipe',
        env: {
            ...process.env,
            PORT: process.env.DEVBOX_PORT || '3000'
        }
    });

    // 将前端输出重定向到日志文件
    const frontendLog = require('fs').createWriteStream(path.join(logsDir, 'frontend.log'));
    frontend.stdout.pipe(frontendLog);
    frontend.stderr.pipe(frontendLog);

    // 保存进程ID
    require('fs').writeFileSync(path.join(projectRoot, 'frontend.pid'), frontend.pid.toString());
};

// 保存后端进程ID
require('fs').writeFileSync(path.join(projectRoot, 'backend.pid'), backend.pid.toString());

// 等待后端启动后再启动前端
waitForBackend().then(success => {
    if (success) {
        startFrontend();
        console.log('应用已成功启动!');
        console.log(`前端服务运行在: http://localhost:${process.env.DEVBOX_PORT || '3000'}`);
        console.log('后端API运行在: http://localhost:8083');
        console.log('WebSocket端点: ws://localhost:8083/ws');
    } else {
        console.error('后端服务启动失败');
        process.exit(1);
    }
});

// 处理进程退出
process.on('SIGINT', () => {
    console.log('正在关闭服务...');
    backend.kill();
    process.exit();
});