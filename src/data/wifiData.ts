import { WifiPoint } from '@/types/geo.d.ts';

/**
 * 生成随机WiFi点数据
 * @param count 生成的WiFi点数量
 * @param bounds 生成范围的经纬度边界 [minLng, minLat, maxLng, maxLat]
 * @returns WiFi点数据数组
 */
export function generateRandomWifiPoints(count: number = 2000, bounds: [number, number, number, number] = [116.3, 39.9, 116.5, 40.1]): WifiPoint[] {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const wifiPoints: WifiPoint[] = [];
  
  const operators = ['中国移动', '中国联通', '中国电信', '其他'];
  const sampleSSIDs = [
    'ChinaNet', 'CMCC', 'ChinaUnicom', 'TP-LINK', 'Xiaomi', 'Huawei',
    'MERCURY', 'FAST', 'D-Link', 'Netgear', 'ASUS', 'Linksys',
    'Office-WiFi', 'Home-Network', 'Guest-WiFi', 'Free-WiFi'
  ];

  for (let i = 0; i < count; i++) {
    const lng = minLng + Math.random() * (maxLng - minLng);
    const lat = minLat + Math.random() * (maxLat - minLat);
    
    const wifiPoint: WifiPoint = {
      id: `wifi_${Date.now()}_${i}`,
      type: 'wifi',
      coordinates: [lng, lat],
      ssid: `${sampleSSIDs[Math.floor(Math.random() * sampleSSIDs.length)]}_${Math.floor(Math.random() * 9999)}`,
      signalQuality: Math.floor(Math.random() * 100),
      operator: operators[Math.floor(Math.random() * operators.length)],
      selected: false,
      cz: '自动生成'
    };
    
    wifiPoints.push(wifiPoint);
  }
  
  return wifiPoints;
}

/**
 * 将WiFi点数据转换为GeoJSON格式
 * @param wifiPoints WiFi点数据数组
 * @returns GeoJSON FeatureCollection
 */
export function convertWifiPointsToGeoJSON(wifiPoints: WifiPoint[]) {
  return {
    type: 'FeatureCollection',
    features: wifiPoints.map(point => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: point.coordinates
      },
      properties: {
        id: point.id,
        type: point.type,
        ssid: point.ssid,
        signalQuality: point.signalQuality,
        operator: point.operator,
        selected: point.selected,
        cz: point.cz
      }
    }))
  };
}

/**
 * 生成WiFi点数据的API接口模拟
 * @param count 生成数量
 * @param bounds 生成范围
 * @returns Promise<WiFi点数据数组>
 */
export async function fetchWifiPoints(count: number = 2000, bounds?: [number, number, number, number]): Promise<WifiPoint[]> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 这里可以替换为实际的API调用
  return generateRandomWifiPoints(count, bounds);
}

/**
 * 根据区域获取WiFi点数据 (为后续真实API接口预留)
 * @param area 区域标识
 * @returns Promise<WiFi点数据数组>
 */
export async function fetchWifiPointsByArea(area: string): Promise<WifiPoint[]> {
  // 预留接口，后续可以替换为真实的API调用
  console.log(`获取区域 ${area} 的WiFi点数据`);
  return fetchWifiPoints();
}

/**
 * 批量更新WiFi点状态 (为后续真实API接口预留)
 * @param wifiPoints 需要更新的WiFi点数据
 * @returns Promise<boolean>
 */
export async function updateWifiPoints(wifiPoints: WifiPoint[]): Promise<boolean> {
  // 预留接口，后续可以替换为真实的API调用
  console.log('批量更新WiFi点状态:', wifiPoints);
  return true;
}
