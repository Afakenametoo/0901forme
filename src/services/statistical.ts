import request from '@/utils/requests'
import {queryData, streetQueryData} from "@/types/echarts";


// 获取窖井材质类型及数量
export const getJgTypeAndNum = async () => {
    return request({
        url: '/underground/search/listPointTextureAndNum',
        method: 'get',
    })
}


// 获取管线材质及数量
export const getLineTypeAndNum = async () => {
    return request({
        url: '/underground/search/listLineTextureAndNum',
        method: 'get'
    })
}


// 获取井盖特征及数量
export const getJgFeatureAndNum = async () => {
    return request({
        url: '/underground/search/listPointFeatureAndNum',
        method: 'get'
    })
}

// 获取管线埋状态及数量
export const getLineDiameterAndNum = async () => {
    return request({
        url: '/underground/search/listLineDiameterAndNum',
        method: 'get'
    })
}

// 获取井盖类型
export const getPointType = () => {
    return request({
        url: '/underground/search/listPointTexture',
        method: 'get'
    })
}

// 获取管线类型
export const getLineType = () => {
    return request({
        url: '/underground/search/listLineTexture',
        method: 'get'
    })
}

// 统计图表数据查询
export const getEchartsData = (obj: queryData) => {
    return request({
        url: '/underground/search/getConditionStatistics',
        method: 'post',
        data: obj
    })
}

// 查询窖井所有特征
export const getPointFeature = () => {
    return request({
        url: '/underground/search/listPointFeature',
        method: 'get'
    })
}

// 查询街道
export const listStreet = (obj: streetQueryData) => {
    return request({
        url: '/underground/search/listStreetByTypeAndLayer',
        method: 'post',
        data: obj
    })
}
