import fs from 'fs';
import path from 'path';

// 生成随机WiFi点数据
function generateRandomWifiPoints(count = 50, bounds = [116.3, 39.9, 116.5, 40.1]) {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const wifiPoints = [];
  
  const operators = ['中国移动', '中国联通', '中国电信', '其他'];
  const sampleSSIDs = [
    'ChinaNet', 'CMCC', 'ChinaUnicom', 'TP-LINK', 'Xiaomi', 'Huawei',
    'MERCURY', 'FAST', 'D-Link', 'Netgear', 'ASUS', 'Linksys',
    'Office-WiFi', 'Home-Network', 'Guest-WiFi', 'Free-WiFi'
  ];

  for (let i = 0; i < count; i++) {
    const lng = minLng + Math.random() * (maxLng - minLng);
    const lat = minLat + Math.random() * (maxLat - minLat);
    
    const wifiPoint = {
      id: `wifi_${Date.now()}_${i}`,
      type: 'wifi',
      ssid: `${sampleSSIDs[Math.floor(Math.random() * sampleSSIDs.length)]}_${Math.floor(Math.random() * 9999)}`,
      signalQuality: Math.floor(Math.random() * 100),
      operator: operators[Math.floor(Math.random() * operators.length)],
      selected: false,
      cz: '自动生成',
      coordinates: [lng, lat]
    };
    
    wifiPoints.push(wifiPoint);
  }
  
  return wifiPoints;
}

// 将WiFi点数据转换为GeoJSON格式
function convertWifiPointsToGeoJSON(wifiPoints) {
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

// 主函数
function main() {
  console.log('开始生成WiFi数据...');
  
  // 生成WiFi点数据
  const wifiPoints = generateRandomWifiPoints(50);
  
  // 转换为GeoJSON
  const geoJSON = convertWifiPointsToGeoJSON(wifiPoints);
  
  // 确保目录存在
  const outputDir = path.join(process.cwd(), 'public', 'files', 'geojson');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 写入文件
  const outputPath = path.join(outputDir, 'WIFI_POINT.geojson');
  fs.writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2));
  
  console.log(`WiFi数据已生成: ${outputPath}`);
  console.log(`生成了 ${wifiPoints.length} 个WiFi点`);
}

// 执行
main();
