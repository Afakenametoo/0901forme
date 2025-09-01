import axios from "axios";
// @ts-ignore
import qs from "qs";
import {config} from "@/config/config";
import {router} from "@/router";
import {ElMessage} from "element-plus";


const invalidCode = -1;
const successCode = [200, 1]
const noPermissionCode = 401
const timeout = 40000


/**
 * @description 处理异常code
 * @author lihua
 * @date 2024/5/15 9:50
 */
// @ts-ignore
const handleCode = (code, msg) => {
    switch (code) {
        // 掉线
        case invalidCode:
            alert('掉线/访问权限问题，需要重新登录！')
            break
        // 无权限
        case noPermissionCode:
            router.push({
                path: '/401'
            }).catch(() => {

            })
            break
        default:
            alert(msg || `后端接口${code}异常`)
            break
    }
}


const instance = axios.create({
    // baseURL,
    baseURL: config.baseApi,
    // 超时时间
    timeout: timeout,
    // 自定义请求头
    headers: {
        'Content-Type': 'application/json;charset=UTF-8'
    }
})


// 拦截请求
axios.interceptors.request.use(
    (config) => {
        // 请求头需要formData数据时，使用qs处理
        if (config.data && config.headers['Content-Type'] === 'application/x-www-form-urlencoded;charset=UTF-8') config.data = qs.stringify(config.data)
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)
// 响应拦截
// axios.interceptors.response.use(
//     (response) => {
//         const res = response.data
//         const {data} = response
//         const {code, msg} = data

//         // 操作成功
//         if (successCode.indexOf(code) !== -1) {
//             return res
//         } else {
//             // 请求失败
//             // 校验失败code，处理场景
//             handleCode(code, msg)
//             return Promise.reject()
//         }
//     },
//     (error) => {
//         const {response, message} = error
//         // 如果返回有data， 校验失败code
//         if (error.response && error.response.data) {
//             const {status, data} = response;
//             handleCode(status, data.msg || message);
//             return Promise.reject(error);
//         } else {
//             // 提示其它异常
//             let {message} = error
//             if (message === "Network Error") {
//                 message = '后端接口连接异常'
//             }
//             if (message.include('timeout')) {
//                 message = '后端接口请求超时'
//             }
//             if (message.include('Request failed with status code')) {
//                 const code = message.substr(message.length - 3)
//                 message = '后端接口' + code + '异常'
//             }
//             ElMessage.error(message || '后端接口未知异常')
//             return Promise.reject(error)
//         }
//     }
// )

export default instance


