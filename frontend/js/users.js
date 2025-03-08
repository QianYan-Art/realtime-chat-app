/**
 * 用户配置文件
 * 包含系统允许登录的用户信息
 * 
 * @typedef {Object} User
 * @property {string} username - 用户名
 * @property {string} password - 密码
 * @property {string} displayName - 显示名称
 */

/**
 * 系统允许的用户列表
 * 只有这两个用户可以登录系统
 * @type {Object.<string, User>}
 */
const ALLOWED_USERS = {
    user1: {
        username: "admin123",
        password: "pass789",
        displayName: "管理员"
    },
    user2: {
        username: "guest456",
        password: "test321",
        displayName: "访客"
    }
};

/**
 * 更新用户信息
 * @param {string} userKey - 用户键名 (user1 或 user2)
 * @param {Object} userData - 新的用户数据
 * @param {string} [userData.username] - 新用户名
 * @param {string} [userData.password] - 新密码
 * @param {string} [userData.displayName] - 新显示名称
 * @returns {boolean} 更新是否成功
 */
function updateUserCredentials(userKey, userData) {
    if (!ALLOWED_USERS[userKey]) {
        console.error(`用户 ${userKey} 不存在`);
        return false;
    }
    
    if (userData.username) {
        ALLOWED_USERS[userKey].username = userData.username;
    }
    
    if (userData.password) {
        ALLOWED_USERS[userKey].password = userData.password;
    }
    
    if (userData.displayName) {
        ALLOWED_USERS[userKey].displayName = userData.displayName;
    }
    
    // 保存到本地存储以便在页面刷新后保留更改
    localStorage.setItem('ALLOWED_USERS', JSON.stringify(ALLOWED_USERS));
    return true;
}

/**
 * 初始化用户配置
 * 从本地存储加载用户配置（如果有）
 */
function initUserConfig() {
    const savedUsers = localStorage.getItem('ALLOWED_USERS');
    if (savedUsers) {
        try {
            const parsedUsers = JSON.parse(savedUsers);
            // 更新全局用户对象
            Object.keys(parsedUsers).forEach(key => {
                ALLOWED_USERS[key] = parsedUsers[key];
            });
            console.log('已从本地存储加载用户配置');
        } catch (error) {
            console.error('解析保存的用户配置时出错:', error);
        }
    }
}

// 初始化用户配置
initUserConfig(); 