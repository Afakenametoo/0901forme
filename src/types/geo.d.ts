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
 * WIFI点数据
 * */
export type WifiPoint = {
  // 基础标识属性（与point类型保持ID和类型字段的一致性）
  id: string; // 唯一标识，与其他地理数据类型统一用string
  type: string; // 可固定为'wifi'，用于区分类型
  
  // 坐标信息（保持与point相同的[经度, 纬度]格式）
  coordinates: [number, number]; // 明确命名为coordinates，避免与point的point字段混淆
  
  // WiFi特有属性
  ssid: string; // WiFi名称（服务集标识）
  signalQuality: number; // 信号质量（百分比0-100）
  operator?: string; // 运营商（可选）
  
  // 可选的状态属性（按需添加，与其他类型保持操作一致性）
  selected?: boolean; // 是否被选中（用于交互）
  cz?: string; // 操作记录（与point、line的cz字段含义一致）
};

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

