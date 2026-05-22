/**
 * 用户配置文件
 * 包含系统的用户显示信息
 * 
 * @typedef {Object} User
 * @property {string} username - 用户名
 * @property {string} displayName - 显示名称
 */

/**
 * 系统允许的用户列表
 * 仅用于UI显示，认证由后端API完成
 * @type {Object.<string, User>}
 */
const ALLOWED_USERS = {
    user1: {
        username: "admin123",
        displayName: "管理员"
    },
    user2: {
        username: "guest456",
        displayName: "访客"
    }
};
