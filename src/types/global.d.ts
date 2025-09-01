/**
 * http 请求体参数
 * */
export type HttpRequest = {
    type: requestType
    url: string,
    data: object,
    headers: object
}

export enum requestType {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete'
}
