// type + id = 唯一标识
/**
 * 点数据
 * */
export type point = {
    // id: number,
    id: string,
    type: string,
    // [lng,lat]
    point: [number, number]
    siltState?: string,
    cz:string,
    selected:boolean,
}


/**
 * 线数据
 * */
export type line = {
    // id: number,
    id: string,
    type: string,
    startPoint?: [number, number],
    endPoint?: [number, number],
    length?: number,
    orient?: number,
    startSiltState?: string,
    endSiltState?: string,
    cz:string,
    selected:boolean,
    gj:string,
    gc:string
    // data?: [number, number]
}

/**
 * 轨迹数据
 * */
export type trajectory = {
    id: number,
    type: string,
    startPoint?: [number, number],
    endPoint?: [number, number],
    length?: number,
    data: [number, number]
}

