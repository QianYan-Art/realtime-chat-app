/**
 * 前端服务器
 * 用于提供静态文件服务和API代理
 */
const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 启用安全性增强
app.use(helmet({
  contentSecurityPolicy: false // 由于使用了CDN资源，暂时禁用CSP
}));

// 启用GZIP压缩
app.use(compression());

// 启用CORS
app.use(cors());

// 确定静态文件目录
const staticDir = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'dist') 
  : __dirname;

// 提供静态文件服务
app.use(express.static(staticDir));

// 所有路由都返回index.html（用于SPA）
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`前端服务器运行在 http://localhost:${PORT}`);
  console.log(`静态文件目录: ${staticDir}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
}); 