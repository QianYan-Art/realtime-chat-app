/**
 * API处理器
 * 负责与后端API的通信
 */
class ApiHandler {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
        this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) || '';
    }

    /**
     * 设置认证令牌
     * @param {string} token 认证令牌
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    }

    /**
     * 清除认证令牌
     */
    clearToken() {
        this.token = '';
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    }

    /**
     * 获取请求头
     * @returns {Object} 请求头对象
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * 发送GET请求
     * @param {string} endpoint API端点
     * @returns {Promise<any>} 响应数据
     */
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`GET请求失败 (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * 发送POST请求
     * @param {string} endpoint API端点
     * @param {Object} data 请求数据
     * @returns {Promise<any>} 响应数据
     */
    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`POST请求失败 (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * 发送PUT请求
     * @param {string} endpoint API端点
     * @param {Object} data 请求数据
     * @returns {Promise<any>} 响应数据
     */
    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`PUT请求失败 (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * 发送DELETE请求
     * @param {string} endpoint API端点
     * @returns {Promise<any>} 响应数据
     */
    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`DELETE请求失败 (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * 用户登录
     * @param {string} username 用户名
     * @param {string} password 密码
     * @returns {Promise<Object>} 登录响应
     */
    async login(username, password) {
        try {
            const response = await this.post('/auth/login', { username, password });
            
            if (response.token) {
                this.setToken(response.token);
            }
            
            return response;
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    }

    /**
     * 用户注册
     * @param {string} username 用户名
     * @param {string} password 密码
     * @param {string} email 电子邮件
     * @returns {Promise<Object>} 注册响应
     */
    async register(username, password, email) {
        try {
            return await this.post('/auth/register', { username, password, email });
        } catch (error) {
            console.error('注册失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户信息
     * @returns {Promise<Object>} 用户信息
     */
    async getUserInfo() {
        try {
            return await this.get('/users/me');
        } catch (error) {
            console.error('获取用户信息失败:', error);
            throw error;
        }
    }

    /**
     * 获取在线用户列表
     * @returns {Promise<Array>} 在线用户列表
     */
    async getOnlineUsers() {
        try {
            return await this.get('/users/online');
        } catch (error) {
            console.error('获取在线用户列表失败:', error);
            throw error;
        }
    }

    /**
     * 获取聊天历史记录
     * @param {number} limit 限制条数
     * @returns {Promise<Array>} 聊天历史记录
     */
    async getChatHistory(limit = 50) {
        try {
            return await this.get(`/messages?limit=${limit}`);
        } catch (error) {
            console.error('获取聊天历史记录失败:', error);
            throw error;
        }
    }
} 