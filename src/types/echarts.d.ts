// 统计图表 条件统计数据类型
export type queryData = {
    type: string,
    texture: Array<string>,
    street: Array<any>,
    range: Array<any>,
    feature: Array<any>,
    layer: Array<any>,
}

export type streetQueryData = {
    type: Array<any>,
    flag: boolean
}