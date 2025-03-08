/**
 * 前端JavaScript文件优化脚本
 * 使用terser压缩JavaScript文件
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 确保安装了terser
try {
    console.log('检查terser是否已安装...');
    execSync('npx terser --version', { stdio: 'pipe' });
    console.log('terser已安装，继续执行...');
} catch (error) {
    console.log('正在安装terser...');
    execSync('npm install terser --save-dev', { stdio: 'inherit' });
    console.log('terser安装完成');
}

// 要优化的JavaScript文件
const jsDir = path.join(__dirname, 'js');
const distDir = path.join(__dirname, 'dist');

// 创建dist目录（如果不存在）
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
    console.log('创建dist目录');
}

// 创建dist/js目录（如果不存在）
const distJsDir = path.join(distDir, 'js');
if (!fs.existsSync(distJsDir)) {
    fs.mkdirSync(distJsDir);
    console.log('创建dist/js目录');
}

// 读取js目录中的所有JavaScript文件
const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));

// 压缩每个JavaScript文件
jsFiles.forEach(file => {
    const filePath = path.join(jsDir, file);
    const distFilePath = path.join(distJsDir, file);
    
    console.log(`正在压缩 ${file}...`);
    
    // 使用terser压缩JavaScript文件
    execSync(`npx terser ${filePath} --compress --mangle --output ${distFilePath}`, { stdio: 'inherit' });
    
    // 获取原始文件和压缩后文件的大小
    const originalSize = fs.statSync(filePath).size;
    const compressedSize = fs.statSync(distFilePath).size;
    const savingsPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
    
    console.log(`${file}: ${originalSize} 字节 -> ${compressedSize} 字节 (节省 ${savingsPercent}%)`);
});

// 复制其他必要文件到dist目录
console.log('复制index.html到dist目录...');
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(distDir, 'index.html'));

console.log('复制server.js到dist目录...');
fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(distDir, 'server.js'));

// 复制styles目录到dist目录
const stylesDir = path.join(__dirname, 'styles');
const distStylesDir = path.join(distDir, 'styles');
if (!fs.existsSync(distStylesDir)) {
    fs.mkdirSync(distStylesDir);
    console.log('创建dist/styles目录');
}

const cssFiles = fs.readdirSync(stylesDir).filter(file => file.endsWith('.css'));
cssFiles.forEach(file => {
    console.log(`复制 ${file} 到dist/styles目录...`);
    fs.copyFileSync(path.join(stylesDir, file), path.join(distStylesDir, file));
});

// 创建package.json文件
const packageJson = {
    "name": "realtime-chat-frontend",
    "version": "1.0.0",
    "description": "实时聊天应用前端（优化版）",
    "main": "server.js",
    "scripts": {
        "start": "node server.js"
    },
    "dependencies": {
        "express": "^4.18.2"
    }
};

console.log('创建dist/package.json文件...');
fs.writeFileSync(
    path.join(distDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
);

console.log('优化完成！优化后的文件位于dist目录中');
console.log('可以通过以下命令运行优化后的应用：');
console.log('cd dist && npm start'); 