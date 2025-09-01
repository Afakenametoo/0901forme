import axios from 'axios';

// 创建一个 Axios 实例
const apiClient = axios.create({
  baseURL: 'http://192.168.31.184:1299', // 替换为后端API地址
  //http://127.0.0.1:1299
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
    // 其他的全局请求头
  }
});

// 处理请求前的逻辑（例如添加 token）
apiClient.interceptors.request.use(config => {
  // 在这里可以添加请求头信息，例如 Authorization
  // config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => {
  return Promise.reject(error);
});

// 处理响应后的逻辑
apiClient.interceptors.response.use(response => {
  return response;
}, error => {
  // 在这里处理响应错误（例如 401，500 等）
  return Promise.reject(error);
});

export default apiClient;