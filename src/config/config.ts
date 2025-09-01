// 环境配置
export interface IConfig {
    env: string // 开发环境
    title: string // 项目title
    baseApi?: string //api请求地址
    nginx?: string // nginx代理地址
}

const dev: IConfig = {
    env: "development",
    title: "开发",
    baseApi: "",
}
const pro: IConfig = {
    env: "production",
    title: "生产",
    baseApi: ""
}

const test: IConfig = {
    env: "test",
    title: "测试",
    baseApi: ""
}

export const config: IConfig = import.meta.env.MODE === 'development' ? dev : import.meta.env.MODE === 'production' ? pro : test
