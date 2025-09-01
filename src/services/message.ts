// 获取管线材质及数量
import request from '@/utils/requests'

export const getMessage = async () => {
    return request({
        url: '/underground/search/message',
        method: 'get'
    })
}