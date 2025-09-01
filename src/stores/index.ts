import {createPinia} from "pinia"
import persist from "pinia-plugin-persistedstate"


// 创建 pinia 实例
const pinia = createPinia()
// 使用持久化存储插件
pinia.use(persist)

export default pinia

// 模块导出
export * from './modules/layer'
export * from './modules/query'
export * from './modules/base'
export * from './modules/statistics'
