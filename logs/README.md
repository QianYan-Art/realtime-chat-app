# 日志系统使用说明

## 日志文件位置

所有日志文件存储在 `logs` 目录下，按照不同类型分为以下几个文件：

- `all.log`: 包含所有级别的日志信息
- `error.log`: 仅包含错误级别的日志信息
- `frontend-error.log`: 专门记录前端应用的错误信息

## 日志文件格式

日志条目的格式如下：

```
时间戳 [线程名] 日志级别 记录器名称 - 日志消息
```

例如：

```
2023-12-01 12:34:56.789 [http-nio-8080-exec-1] ERROR frontend - 前端错误: Cannot read property 'value' of undefined
堆栈信息: TypeError: Cannot read property 'value' of undefined
    at Component.render (http://localhost:3000/static/js/main.chunk.js:123:45)
组件: at Component (http://localhost:3000/static/js/main.chunk.js:123:45)
```

## 日志轮转

日志文件会按日期进行轮转，格式为 `{日志名称}-{日期}.log`，例如 `error-2023-12-01.log`。系统会保留最近30天的日志文件。

## 如何查看日志

### 在开发环境中

1. 控制台输出：所有日志都会在控制台中显示
2. 日志文件：可以直接在 `logs` 目录下查看相应的日志文件

### 在生产环境中

1. 通过SSH连接到服务器
2. 进入应用程序目录
3. 查看 `logs` 目录下的日志文件

可以使用以下命令查看实时日志：

```bash
# 查看所有日志
tail -f logs/all.log

# 查看错误日志
tail -f logs/error.log

# 查看前端错误日志
tail -f logs/frontend-error.log
```

## 日志级别

系统使用以下日志级别：

- ERROR: 错误信息，表示出现了严重问题
- WARN: 警告信息，表示可能存在问题
- INFO: 一般信息，表示系统正常运行的状态
- DEBUG: 调试信息，用于开发调试
- TRACE: 跟踪信息，最详细的日志级别

在生产环境中，默认只记录 INFO 级别及以上的日志。