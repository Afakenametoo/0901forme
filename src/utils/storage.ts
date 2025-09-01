/**
 * @description localstorage本地存储封装
 * @author lihua
 * @date 2024/5/15 16:53
 */
export const localStorage = {
    // 存储
    set(key: string, value: any) {
        window.localStorage.setItem(key, JSON.stringify(value))
    },

    // 取出数据
    get<T>(key: string) {
        const value = window.localStorage.getItem(key)
        return (value && value != "undefined" && value != null) ? <T>JSON.parse(value) : "{}"
    },

    // 删除数据
    remove(key: string) {
        window.localStorage.removeItem(key)
    }
}


/**
 * @description sessionStorage
 * @author lihua
 * @date 2024/5/15 16:53
 */
export const sessionStorage = {
    // 存储
    set(key: string, value: any) {
        window.sessionStorage.setItem(key, JSON.stringify(value))
    },

    // 取出数据
    get<T>(key: string) {
        const value = window.sessionStorage.getItem(key)
        return (value && value != "undefined" && value != null) ? <T>JSON.parse(value) : "{}"
    },

    // 删除数据
    remove(key: string) {
        window.sessionStorage.removeItem(key)
    }
}


