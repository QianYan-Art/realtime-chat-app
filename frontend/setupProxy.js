const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 代理API请求
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:8083',
    changeOrigin: true
  }));

  // 代理WebSocket请求
  app.use('/ws', createProxyMiddleware({
    target: 'http://localhost:8083',
    changeOrigin: true,
    ws: true
  }));
};