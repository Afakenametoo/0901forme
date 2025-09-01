/*
 * @Author:
 * @Date: 2024-12-02 09:15:40
 * @LastEditors: Sleip
 * @LastEditTime: 2024-12-10 08:51:50
 * @FilePath: \underground_pipelines_display\src\services\query.ts
 * @Description: 
 * 
 * Copyright (c) 2024 by Sleip, All Rights Reserved. 
 */
// 统计图表数据查询
import request from '@/utils/requests'

/**
 * @description: 查询所有街道
 * @param {*} queryParams
 * @return {*}
 */
export const getAllStreet =async (queryParams) => {
    return request({
        url: '/underground/search/listStreetByTypeAndLayer',
        method: 'post',
        data:  queryParams
    })
}