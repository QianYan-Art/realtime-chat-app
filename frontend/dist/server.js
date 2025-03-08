/**
 * 前端静态文件服务器
 */
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// 设置静态文件目录
app.use(express.static(__dirname));

// 所有请求都返回index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`前端服务器运行在 http://localhost:${PORT}`);
}); 