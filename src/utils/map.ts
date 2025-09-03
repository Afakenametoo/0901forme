import mapboxgl, {LngLatBounds} from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import {mStyle} from "@/styles/utils/style";
import {baseStore} from "@/stores";
import {setRemoveBoxSelect} from '@/stores/globalBoxSelect';
import {ElMessage, ElPagination} from 'element-plus';
import * as turf from '@turf/turf';
import {removeGlobalNode} from "element-plus/es/utils";
import {specialLayer} from "@/data/layerConfig";

const baseUrl = 'http://192.168.31.183:8183' // 基础URL，用于访问后端服务

//初始化地图
const initMap = () => {
    //去除token - Mapbox需要访问令牌，这里设置为空因为我们使用自己的瓦片服务
    mapboxgl.accessToken = 'pk.eyJ1IjoiZmdqaXBvbW0iLCJhIjoiY21kYnVpczRiMTBydzJpcHpibnE5N2p5dCJ9.2erVYw5qSP341CeeigQUFw'

    // 创建自定义地图类以绕过Mapbox的认证机制
    class Cjmapbox extends mapboxgl.Map {
        __proto__: any;
    }

    // 重写认证方法，使其总是返回true，绕过Mapbox的令牌验证
    Cjmapbox.prototype.__proto__._authenticate = function () {
        return true
    }
    // 创建地图实例
    const map = new mapboxgl.Map({
        container: 'baseMap', // 地图容器的DOM元素ID
        center: [120.868041, 29.513075], // 地图初始中心点 [经度, 纬度]
        // style: mStyle, // 地图样式对象
        attributionControl: false, // 是否显示归属控件
        zoom: 16, // 初始缩放级别
        pitch: 0, // 地图倾斜角度（0为正视图）
        maxZoom: 2000, // 最大缩放级别
        minZoom: 1, // 最小缩放级别
        // renderWorldCopies: true
        preserveDrawingBuffer: true  // 保留绘图缓冲区，用于截图功能
    })
    //加载基础底图：天地图在线资源
    const tdtToken = '88ee1e6bc55dfee4b2c8fbc05d6b2efc'  // 天地图服务访问令牌
    // 天地图图层配置数组
    const baseImgLyrs = [
        // 矢量底图
        {
            name: 'vec_w', // 图层名称
            url: "http://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&tk=" + tdtToken, // 瓦片服务URL
            // url: "/tiles/sl/vec_w/{z}/{y}/{x}.png",
            show: true // 是否显示
        },
        {
            name: 'cva_w', // 注记图层名称
            // url: "/tiles/sl/cva_w/{z}/{y}/{x}.png",
            url: "http://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&tk=" + tdtToken, // 注记瓦片服务URL
            show: true, // 是否显示注记图层
        }
    ]
    // 当地图加载完成后执行
    map.on('load', () => {
        // 添加天地图基础图层
        baseImgLyrs.forEach(lyr => {
            addRasterWMTSLayer(map, lyr)
        })
        // 加载图标资源（确保你提供的是支持的图片格式，SVG 不支持）
        // 加载雨水点图标
        if (!map.hasImage('YS')) {
            map.loadImage('src/assets/YS.png', (error, image) => {
                if (error) throw error; // 如果加载失败则抛出错误
                map.addImage('YS', image);  // 添加图标到 Mapbox
            });
        }
        // 加载污水点图标
        if (!map.hasImage('WS')) {
            map.loadImage('src/assets/WS.png', (error, image) => {
                if (error) throw error; // 如果加载失败则抛出错误
                map.addImage('WS', image);  // 添加图标到 Mapbox
            });
        }
        // 加载污水高亮图标
        if (!map.hasImage('WS_H')) {
            map.loadImage('src/assets/WS_H.png', (error, image) => {
                if (error) throw error; // 如果加载失败则抛出错误
                map.addImage('WS_H', image);  // 添加图标到 Mapbox
            });
        }
        // 加载雨水高亮图标
        if (!map.hasImage('YS_H')) {
            map.loadImage('src/assets/YS_H.png', (error, image) => {
                if (error) throw error; // 如果加载失败则抛出错误
                map.addImage('YS_H', image);  // 添加图标到 Mapbox
            });
        }
        // 创建简单的WiFi图标
        if(!map.hasImage('WIFI_ICON')){
            // 创建一个简单但醒目的WiFi图标
            const canvas = document.createElement('canvas');
            canvas.width = 32; // 图标宽度
            canvas.height = 32; // 图标高度
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // 绘制绿色圆形背景
                ctx.fillStyle = '#00A86B'; // 绿色填充
                ctx.beginPath();
                ctx.arc(16, 16, 15, 0, 2 * Math.PI); // 绘制圆形
                ctx.fill();
                
                // 绘制白色边框
                ctx.strokeStyle = '#FFFFFF'; // 白色边框
                ctx.lineWidth = 2; // 边框宽度
                ctx.beginPath();
                ctx.arc(16, 16, 15, 0, 2 * Math.PI); // 绘制圆形边框
                ctx.stroke();
                
                // 绘制大号"W"字符
                ctx.fillStyle = '#FFFFFF'; // 白色文字
                ctx.font = 'bold 16px Arial'; // 字体样式
                ctx.textAlign = 'center'; // 文字居中对齐
                ctx.textBaseline = 'middle'; // 文字垂直居中
                ctx.fillText('W', 16, 16); // 绘制文字
                
                const imageData = ctx.getImageData(0, 0, 32, 32); // 获取图像数据
                map.addImage('WIFI_ICON', imageData); // 添加到地图
                console.log('WiFi图标创建成功');
            }
        }
        
        // 创建WiFi高亮图标
        if (!map.hasImage('WIFI_ICON_H')) {
            const canvas = document.createElement('canvas');
            canvas.width = 32; // 图标宽度
            canvas.height = 32; // 图标高度
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // 绘制金色圆形背景
                ctx.fillStyle = '#FFD700'; // 金色填充
                ctx.beginPath();
                ctx.arc(16, 16, 15, 0, 2 * Math.PI); // 绘制圆形
                ctx.fill();
                
                // 绘制黑色边框
                ctx.strokeStyle = '#000000'; // 黑色边框
                ctx.lineWidth = 2; // 边框宽度
                ctx.beginPath();
                ctx.arc(16, 16, 15, 0, 2 * Math.PI); // 绘制圆形边框
                ctx.stroke();
                
                // 绘制大号"W"字符
                ctx.fillStyle = '#000000'; // 黑色文字
                ctx.font = 'bold 16px Arial'; // 字体样式
                ctx.textAlign = 'center'; // 文字居中对齐
                ctx.textBaseline = 'middle'; // 文字垂直居中
                ctx.fillText('W', 16, 16); // 绘制文字
                
                const imageData = ctx.getImageData(0, 0, 32, 32); // 获取图像数据
                map.addImage('WIFI_ICON_H', imageData); // 添加到地图
                console.log('WiFi高亮图标创建成功');
            }
        }
    })
    map._logoControl && map.removeControl(map._logoControl) //去除mapbox logo
    map.addControl(new mapboxgl.ScaleControl()) // 添加比例尺控件
    return map // 返回地图实例
}

//添加wmts影像瓦片图层
const addRasterWMTSLayer = (map: any, item: any) => {
    if (item.name && item.url) {
    // 数据源不存在时才创建
    if (!map.getSource(item.name)) {
      map.addSource(item.name, {
        type: 'raster', // 数据源类型为栅格
        tiles: [item.url], // 瓦片URL数组
        tileSize: 256, // 瓦片大小
      });
    }
    // 图层不存在时才创建
    if (!map.getLayer(item.name)) {
      map.addLayer({
        id: item.name, // 图层ID
        type: 'raster', // 图层类型为栅格
        source: item.name, // 数据源名称
        'source-layer': item.name, // 源图层名称
        layout: { visibility: 'visible' } // 默认可见
      });
    }
  }
    // 监听缩放事件，控制图层显示
    map.on('zoom', () => {
        const zoom = map.getZoom(); // 获取当前缩放级别
        if (zoom > map.getMaxZoom()) { // 如果当前缩放超过最大限制
            map.setZoom(map.getMaxZoom() - 1, {duration: 0}); // 设置缩放到最大级别减1
            map.once('zoomend', () => { // 缩放结束后执行
                map.setLayoutProperty(item.name, 'visibility', 'none'); // 隐藏图层
                map.setZoom(map.getMaxZoom()); // 设置为最大缩放级别
                map.setLayoutProperty(item.name, 'visibility', 'visible') // 显示图层
            })
        }
    })
}

/**
 * @description: 根据类型加载图层
 * @param {any} map 地图实例
 * @param {any} item 图层配置项
 * @param {any} type 图层类型
 * @return {*}
 */
const addVecWMTSLayer = (map: any, item: any) => {
    if (item.name && map) {
        // 如果数据源不存在且有URL，则创建数据源
        if (!map.getSource(item.name) && item.url) {
            map.addSource(item.name, {
                type: 'vector', // 矢量数据源
                tiles: [import.meta.env.VITE_BASE + item.url] // 瓦片URL数组，使用环境变量
            });
        }
        // 如果图层不存在，则创建图层
        if (!map.getLayer(item.name)) {
            map.addLayer({
                'id': item.name, // 图层ID
                'type': item.type, // 图层类型（如circle, line, fill等）
                'source': item.source || item.name, // 数据源名称
                'source-layer': item.source || item.name, // 源图层名称
                'paint': item.style || {}, // 图层绘制样式
                'layout': item.layout || {}, // 图层布局属性
            });
        }
        // 如果指定了中心点，则平移到指定位置
        if (item.center) {
            map.flyTo({
                center: item.center, // 中心点坐标
                zoom: item.zoom, // 缩放级别
                speed: 2, // 飞行速度
                curve: 1, // 飞行曲线
                easing(t: number) {
                    return t; // 缓动函数
                }
            });
        }
    }
};
//添加geojson矢量瓦片图层及label
const addGeoJsonLayer = (
    map: any,
    item: any,
    options: { beforeId?: string | null } = {}
) => {
    const {beforeId = null} = options; // 在指定图层之前添加新图层
    if (item.name && map) {
        // 1. 加载数据源
        if (map.getSource(item.name) == undefined && item.data) {
            map.addSource(item.name, {
                type: 'geojson', // GeoJSON数据源
                data: item.data // GeoJSON数据
            });
        }
        // 如果图层不存在，则创建图层
        if (!map.getLayer(item.name)) {
            // 2. 加载地图图层，控制显示隐藏
            map.addLayer({
                id: item.name, // 图层ID
                type: item.type, // 图层类型
                source: item.source || item.name, // 数据源
                paint: item.style || {}, // 绘制样式
                layout: item.layout || {} // 布局属性
            }, beforeId);
        } else {
            map.setLayoutProperty(item.name, 'visibility', 'visible'); // 设置图层可见
        }
    }
};

// 添加聚合点图层
const addClusterPointLayer = (map: any, item: any, options: { beforeId?: string | null } = {}) => {
    const {beforeId = null} = options; // 在指定图层之前添加
    debugger
    if (item.name && map) {
        // 1.加载数据源
        if (map.getSource(item.name) == undefined && item.url) {
            map.addSource(item.name, {
                type: 'geojson', // GeoJSON数据源
                data: item.url, // 数据URL
                cluster: true, // 启用聚合功能
                clusterMaxZoom: 17, // 聚合的最大缩放级别
                clusterRadius: 50 // 聚合半径（像素）
            })
        }
        // 添加非聚合图层（单个点）
        if (!map.getLayer(item.name)) {
            map.addLayer({
                'id': item.name, // 图层ID
                'type': item.type, // 图层类型
                'source': item.source || item.name, // 数据源
                'filter': item.filter, // 过滤条件
                'paint': item.style || {}, // 绘制样式
                'layout': item.layout || {} // 布局属性
            }, beforeId);
        } else {
            map.setLayoutProperty(item.name, 'visibility', 'visible') // 设置可见性
        }
        // 添加聚合图层（显示聚合点的圆圈）
        if (!map.getLayer(item.name + "_cluster")) {
            map.addLayer({
                'id': item.name + "_cluster", // 聚合图层ID
                'type': "circle", // 圆形图层
                'source': item.source || item.name, // 数据源
                'filter': ["has", "point_count"], // 只显示有point_count属性的要素（聚合点）
                'paint': {
                    // 根据点数量设置圆圈颜色
                    "circle-color": [
                        "step",
                        ["get", "point_count"],
                        "#51bbd6", // <=默认颜色
                        20, // 当点数>20时
                        "#f1f075", // 使用此颜色
                        50, // 当点数>50时
                        "#f28cb1", // 使用此颜色
                    ],
                    // 根据点数量设置圆圈半径
                    "circle-radius": ["step", ["get", "point_count"], 12, 12, 16, 20, 25],
                },
            }, beforeId)
        } else {
            map.setLayoutProperty(item.name + "_cluster", 'visibility', 'visible') // 设置可见性
        }
        // 添加聚合数量图层（显示聚合点中的点数量）
        if (!map.getLayer(item.name + "_cluster_count")) {
            map.addLayer({
                'id': item.name + "_cluster_count", // 聚合数量图层ID
                'type': "symbol", // 符号图层
                'source': item.source || item.name, // 数据源
                'filter': ["has", "point_count"], // 只显示聚合点
                'layout': {
                    "text-field": ["get", "point_count_abbreviated"], // 显示点数量（缩写形式）
                    "text-size": 12, // 文字大小
                },
            }, beforeId)
        } else {
            map.setLayoutProperty(item.name + "_cluster_count", 'visibility', 'visible') // 设置可见性
        }
    }
}

//移除所有图层
const removeAllLayers = (map: any) => {
    var layers = map.getStyle().layers // 获取所有图层
    if (layers.length > 0) {
        layers.forEach((lyr: any) => {
            map.removeLayer(lyr.id) // 移除每个图层
        })
    }
}

//根据图层id设置显隐
const setLyrVisible = (map: any, id: string, visible: boolean) => {
    if (visible) {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible') // 设置可见
    } else {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none') // 设置不可见
    }
}

//根据id移除图层
const removeLayerById = (map: any, id: string) => {
    if (map.getLayer(id))
        map.removeLayer(id) // 移除图层
    if (map.getSource(id))
        map.removeSource(id) // 移除数据源
}

// 图层位置变换，id越靠后，位置越靠上
const moveLayer = (map: any, idArr: Array<string>) => {
    if (idArr.length > 0) {
        idArr.forEach(id => {
            if (map.getLayer(id)) {
                map.moveLayer(id) // 移动图层到最上层
            }
        })
    }
}

const moveLayerAll = (map: any) => {
    // 定义图层顺序数组，后面的图层会显示在前面的图层之上
    const arr = ['WS_LINE', 'YS_LINE', 'WS_LINE_dashed', 'YS_LINE_dashed', 'WS_POINT_cluster', 'WS_POINT_cluster_count', 'YS_POINT_cluster',
        'YS_POINT_cluster_count', 'WS_POINT', 'YS_POINT', 'WS_POINT_label', 'YS_POINT_label']
    arr.forEach(id => {
        if (map.getLayer(id)) {
            map.moveLayer(id) // 按顺序移动图层
        }
    })
}

// 鼠标移入事件处理函数
const onMouseMove = (e: any) => {
    bStore.boxMap.getCanvas().style.cursor = 'pointer'; // 设置鼠标样式为手型
};

// 鼠标离开事件处理函数
const onMouseLeave = (e: any) => {
    bStore.boxMap.getCanvas().style.cursor = 'grab'; // 设置鼠标样式为抓取状
};

// 设置图层鼠标样式
const setLayerCursor = (map: any, id: string, set: boolean) => {
    if (map.getLayer(id)) {
        //console.log("id",id);
        if (set) {
            map.on('mousemove', id, onMouseMove); // 添加鼠标移入事件
            map.on('mouseleave', id, onMouseLeave); // 添加鼠标离开事件
        } else {
            map.off('mousemove', id, onMouseMove); // 移除鼠标移入事件
            map.off('mouseleave', id, onMouseLeave); // 移除鼠标离开事件
        }
    }
};


// 弹窗相关功能函数
const bStore = baseStore() // 获取全局状态存储实例

let defaultPopup = {
    infos: null, // 弹窗信息内容
    option: null // 弹窗选项
}
let mapListeners: any = [] // 地图监听器数组
let flowLayers: any = [] // 流向图层数组
let clusterListeners: any = [] // 聚合监听器数组
// 设置监听事件
const setLayerListen = (map: any, mapping: any, layer: any) => {
    const listen = async (e: any) => {
        if (e.defaultPrevented) return; // 如果事件已被阻止默认行为则返回
        // 1.获取点中feature
        let clickedFeature = e.features[0] // 获取点击的第一个要素
        if (clickedFeature) {
            clearSelect(map) // 清除之前的选择
            // 2. 设置弹窗内容
            const infos = [{
                name: layer.name, // 图层名称
                properties: clickedFeature.properties, // 要素属性
                mapping: mapping // 属性映射
            }]
            let popupInfo = {
                infos: infos, // 弹窗信息
                option: null, // 弹窗选项
                lnglat: e.lngLat // 点击位置的经纬度
            }
            bStore.setPopupInfo(popupInfo) // 设置弹窗信息到全局状态
            removeClickedFeas(map) // 移除已点击的要素
            const hoveredPolygonId = e.features[0].properties.ObjectID // 获取要素ID
            // 3.设置高亮图层
            addSelect(map, layer, hoveredPolygonId) // 添加高亮效果
            // 4.设置流向动画
            if (layer.type === 'line') { // 如果是线图层
                let tempFlow = {
                    type: 'line', // 图层类型
                    name: 'GXSS_LINE_dashed', // 图层名称
                    data: clickedFeature, // 数据
                    alias: '管线设置', // 别名
                    style: {
                        'line-color': '#a616f2', // 线颜色
                        'line-width': 4.5, // 线宽度
                        'line-opacity': [
                            "step",
                            ["zoom"],
                            0,
                            16,
                            1
                        ]
                    }
                }
                addGeoJsonLayer(map, tempFlow) // 添加GeoJSON图层
                flowLayers.push(tempFlow) // 添加到流向图层数组
                clickAnimateDashArray(0, tempFlow.name) // 启动动画
            }
        }
        e.preventDefault() // 阻止默认行为
    }
    //地图上左键击中图层
    map.on('click', layer.name, listen) // 添加点击监听
    //对工程红线图层设置监听事件
    mapListeners[layer.name] = listen // 保存监听器引用
}


const setClusterListen = (map: any, name: any) => {
    const listen = (e: any) => {
        if (e.defaultPrevented) return; // 如果事件已被阻止默认行为则返回
        // 查询点击位置的聚合要素
        const features = map.queryRenderedFeatures(e.point, {
            layers: [name + "_cluster"] // 查询指定聚合图层
        });
        const clusterId = features[0].properties.cluster_id; // 获取聚合ID
        // 获取聚合展开的缩放级别
        map.getSource(name).getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
                if (err) return; // 如果出错则返回
                // 平滑移动到聚合点位置并缩放到适当级别
                map.easeTo({
                    center: features[0].geometry.coordinates, // 中心点坐标
                    zoom: zoom // 缩放级别
                });
            }
        );
        e.preventDefault() // 阻止默认行为
    }
    clusterListeners[name + "_cluster"] = listen // 保存监听器引用
    map.on('click', name + "_cluster", listen) // 添加点击监听
}

// 选中高亮样式
const addSelect = (map: any, layer: any, selectId: any) => {
    if (layer.type === 'symbol') { // 如果是符号图层
        if (layer.name == 'WS_POINT') { // 污水点图层
            map.setLayoutProperty(layer.name, 'icon-image', [
                'case',
                [
                    'match',
                    ['get', 'ObjectID'],
                    selectId,
                    true,
                    false
                ],
                'WS_H', // 匹配时使用高亮图标
                'WS' // 不匹配时使用普通图标
            ])
        } else if (layer.name == 'YS_POINT') { // 雨水点图层
            map.setLayoutProperty(layer.name, 'icon-image', [
                'case',
                [
                    'match',
                    ['get', 'ObjectID'],
                    selectId,
                    true,
                    false
                ],
                'YS_H', // 匹配时使用高亮图标
                'YS' // 不匹配时使用普通图标
            ])
        }
        else if(layer.name==="WIFI_POINT"){ // WiFi点图层
            map.setLayoutProperty(layer.name, 'icon-image', [
                'case',
                ['match', ['get', 'id'], selectId, true, false],
                'WIFI_ICON_H', // 高亮图标
                'WIFI_ICON'    // 默认图标
            ]);
        }
    } else { // 其他类型图层（如线图层）
        if (layer.name === 'YS_LINE') { // 雨水管线图层
            map.setPaintProperty(layer.name, 'line-color', [
                'case',
                [
                    'match',
                    ['get', 'ObjectID'],
                    selectId,
                    true,
                    false
                ],
                '#f2fe60', // 匹配时的颜色（黄色）
                '#314ee6' // 不匹配时的颜色（蓝色）
            ])
        } else if (layer.name === 'WS_LINE') { // 污水管线图层
            map.setPaintProperty(layer.name, 'line-color', [
                'case',
                [
                    'match',
                    ['get', 'ObjectID'],
                    selectId,
                    true,
                    false
                ],
                '#f2fe60', // 匹配时的颜色（黄色）
                '#ec682c' // 不匹配时的颜色（橙色）
            ])
        }
    }
}

// 恢复选中样式
const clearSelect = (map: any) => {
    // 恢复雨水管线默认颜色
    if (map.getLayer('YS_LINE')) {
        map.setPaintProperty('YS_LINE', 'line-color', '#0000ff')
    }
    // 恢复污水管线默认颜色
    if (map.getLayer('WS_LINE')) {
        map.setPaintProperty('WS_LINE', 'line-color', '#fe5708')
    }
    // 恢复污水点默认图标
    if (map.getLayer('WS_POINT')) {
        map.setLayoutProperty('WS_POINT', 'icon-image', 'WS')
    }
    // 恢复雨水点默认图标
    if (map.getLayer('YS_POINT')) {
        map.setLayoutProperty('YS_POINT', 'icon-image', 'YS')
    }

}

//右键清除计算结果
const setCtxtListen = (map: any, keyword: string) => {
    //地图上右键初始化
    map.on('contextmenu', (e: any) => {
        //清除所有相关图层，关闭计算窗口和popup
        bStore.setPopupInfo(defaultPopup) // 设置默认弹窗
        //移除高亮图斑
        removeClickedFeas(map) // 移除点击的要素
        // 清除选中高亮图斑
        clearSelect(map) // 清除选择效果
        //移除地图上所有图层
        //todo  way2:获取elements打勾的值
        let layers = map.getStyle().layers // 获取所有图层
        layers.forEach((lyr: any) => {
            if (lyr.id.includes(keyword)) { // 如果图层ID包含关键字
                removeLayerById(map, lyr.id.split('-')[0] + '_label') // 移除标签图层
                removeLayerById(map, lyr.id) // 移除图层
                bStore.removeUncheckedLayer(lyr.id) // 从状态中移除未选中图层
            }
        })
    })
}

// 移除监听事件
const removeListen = (map: any, layerName: string) => {
    if (mapListeners[layerName]) {
        map.off('click', layerName, mapListeners[layerName]) // 移除点击监听
    }
}

// 移除全部点击的要素，exe为例外的图层
const removeClickedFeas = async (map: any) => {
    if (flowLayers.length > 0) {
        flowLayers.forEach(function (lyr: any) {
            removeLayerById(map, lyr.name) // 移除流向图层
        })
    }
    // 清除动画
    if (animationId != -1) {
        cancelAnimationFrame(animationId) // 取消动画帧
        animationId = -1
    }
}

/**
 * @description: 雨水管线流向动画
 * @param {*} timestamp 时间戳
 * @param {*} layerName 图层名称
 * @return {*}
 */
function animateDashArray(timestamp: number) {
    // Update line-dasharray using the next value in dashArraySequence. The
    // divisor in the expression `timestamp / 50` controls the animation speed.
    const newStep = parseInt(String((timestamp / 50) % dashArraySequence.length)); // 计算动画步骤
    if (newStep !== step) {
        toRaw(bStore.boxMap).setPaintProperty(
            'YS_LINE_dashed', // 图层名称
            "line-dasharray", // 属性名
            dashArraySequence[step] // 虚线样式
        );
        step = newStep; // 更新步骤
    }
    animationId = requestAnimationFrame(animateDashArray); // 请求下一帧动画
}

/**
 * @description: 控制label图层、流向图层显隐
 * @param {*} value  true||false 显示或隐藏
 * @param {*} dataName  二级目录名称
 * @param {*} type  图层类型(label或flow)
 * @return {*}
 */
const setLayerVisible = (value: number, dataName: string, type: string) => {
    const visibility = value ? "visible" : "none" // 根据值确定可见性
    const layerName = type === 'label' ? dataName + '_label' : dataName + '_dashed' // 根据类型确定图层名称
    if (toRaw(bStore.boxMap).getLayer(layerName))
        toRaw(bStore.boxMap).setLayoutProperty(layerName, "visibility", visibility) // 设置可见性
    if (type == 'flow') { // 如果是流向图层
        if (dataName.includes('YS')) { // 雨水管线
            if (value) animateDashArray(0) // 启动动画
            else {
                cancelAnimationFrame(animationId) // 取消动画
                animationId = -1
            }
        } else if (dataName.includes('WS')) { // 污水管线
            if (value) animateDashArray2(0) // 启动动画
            else {
                cancelAnimationFrame(animationId2) // 取消动画
                animationId2 = -1
            }
        }
    }
}

let step2 = 0; // 动画步骤计数器
let animationId2 = -1; // 动画ID

function animateDashArray2(timestamp: number) {
    const newStep = parseInt(String((timestamp / 50) % dashArraySequence.length)); // 计算动画步骤
    if (newStep !== step2) {
        toRaw(bStore.boxMap).setPaintProperty(
            'WS_LINE_dashed', // 污水管线虚线图层
            "line-dasharray", // 虚线属性
            dashArraySequence[step2] // 虚线样式
        );
        step2 = newStep; // 更新步骤
    }
    animationId2 = requestAnimationFrame(animateDashArray2); // 请求下一帧动画
}

const dashArraySequence = [
    [0, 4, 3],
    [0.5, 4, 2.5],
    [1, 4, 2],
    [1.5, 4, 1.5],
    [2, 4, 1],
    [2.5, 4, 0.5],
    [3, 4, 0],
    [0, 0.5, 3, 3.5],
    [0, 1, 3, 3],
    [0, 1.5, 3, 2.5],
    [0, 2, 3, 2],
    [0, 2.5, 3, 1.5],
    [0, 3, 3, 1],
    [0, 3.5, 3, 0.5]
]; // 虚线动画序列


let step = 0; // 动画步骤计数器
let animationId = -1; // 动画ID

function clickAnimateDashArray(timestamp: number, layerName: string) {
    // Update line-dasharray using the next value in dashArraySequence. The
    // divisor in the expression `timestamp / 50` controls the animation speed.
    const newStep = parseInt(String((timestamp / 50) % dashArraySequence.length)); // 计算动画步骤
    if (newStep !== step) {
        toRaw(bStore.boxMap).setPaintProperty(
            layerName, // 图层名称
            "line-dasharray", // 虚线属性
            dashArraySequence[step] // 虚线样式
        );
        step = newStep; // 更新步骤
    }
    console.log(layerName)
    // Request the next frame of the animation.
    animationId = requestAnimationFrame(function (timestamp) {
        clickAnimateDashArray(timestamp, layerName) // 递归调用实现动画
    });
}

// 加载静态geojson数据
const loadLocalGeojson = async (path: any) => {
    const res = await fetch(path); // 获取数据
    const data = await res.json(); // 解析为JSON
    return data // 返回数据
}

// ==================== WiFi相关功能函数 ====================

/**
 * 初始化WiFi图层
 * @param map 地图实例
 */
const initWifiLayer = (map: any) => {
    // 添加WiFi数据源
    if (!map.getSource('wifi-source')) {
        map.addSource('wifi-source', {
            type: 'geojson', // GeoJSON数据源类型
            data: {
                type: 'FeatureCollection', // 要素集合类型
                features: [] // 空的要素数组
            },
            cluster: true, // 启用聚合功能
            clusterMaxZoom: 12, // 聚合最大缩放级别
            clusterRadius: 20 // 聚合半径（像素）
        });
    }

    // 添加WiFi聚合圆点图层
    if (!map.getLayer('wifi-clusters')) {
        map.addLayer({
            id: 'wifi-clusters', // 图层ID
            type: 'circle', // 圆形图层
            source: 'wifi-source', // 数据源
            filter: ['has', 'point_count'], // 只显示有point_count属性的要素（聚合点）
            paint: {
                // 根据点数量设置圆圈颜色
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6', // <=默认颜色
                    10, // 当点数>10时
                    '#f1f075', // 使用此颜色
                    30, // 当点数>30时
                    '#f28cb1' // 使用此颜色
                ],
                // 根据点数量设置圆圈半径
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    15, // 默认半径
                    10, // 当点数>10时
                    20, // 半径为20
                    30, // 当点数>30时
                    25 // 半径为25
                ]
            }
        });
    }

    // 添加WiFi聚合数量文字图层
    if (!map.getLayer('wifi-cluster-count')) {
        map.addLayer({
            id: 'wifi-cluster-count', // 图层ID
            type: 'symbol', // 符号图层
            source: 'wifi-source', // 数据源
            filter: ['has', 'point_count'], // 只显示聚合点
            layout: {
                'text-field': '{point_count_abbreviated}', // 显示点数量（缩写形式）
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'], // 字体
                'text-size': 12 // 文字大小
            }
        });
    }

    // 添加WiFi单点图层
    if (!map.getLayer('wifi-points')) {
        map.addLayer({
            id: 'wifi-points', // 图层ID
            type: 'symbol', // 符号图层
            source: 'wifi-source', // 数据源
            filter: ['!', ['has', 'point_count']], // 只显示非聚合点（没有point_count属性的点）
            layout: {
                'icon-image': 'WIFI_ICON', // 图标图片
                'icon-size': 0.4, // 图标大小
                'icon-anchor': 'center', // 图标锚点位置
                'icon-allow-overlap': true, // 允许图标重叠
                // 临时禁用文字标签，只显示图标
                // 'text-field': ['get', 'ssid'], // 显示SSID
                // 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'], // 字体
                // 'text-offset': [0, 1.5], // 文字偏移
                // 'text-anchor': 'top', // 文字锚点
                // 'text-size': 10 // 文字大小
            },
            paint: {
                'text-color': '#000000', // 文字颜色
                'text-halo-color': '#ffffff', // 文字光晕颜色
                'text-halo-width': 1 // 文字光晕宽度
            }
        });
    }
    
    // 确保聚合图层可见
    if (map.getLayer('wifi-clusters')) {
        map.setLayoutProperty('wifi-clusters', 'visibility', 'visible'); // 设置聚合图层可见
    }
    if (map.getLayer('wifi-cluster-count')) {
        map.setLayoutProperty('wifi-cluster-count', 'visibility', 'visible'); // 设置聚合数量图层可见
    }
    if (map.getLayer('wifi-points')) {
        map.setLayoutProperty('wifi-points', 'visibility', 'visible'); // 设置单点图层可见
    }
};

/**
 * 加载WiFi点数据到地图
 * @param map 地图实例
 * @param wifiData WiFi数据数组
 */
const loadWifiData = (map: any, wifiData: any[]) => {
    // 如果WiFi数据源不存在，则初始化WiFi图层
    if (!map.getSource('wifi-source')) {
        console.log('初始化WiFi图层...');
        initWifiLayer(map);
    }
    
    // 将WiFi数据转换为GeoJSON格式
    const geoJsonData = {
        type: 'FeatureCollection', // 要素集合类型
        features: wifiData.map(wifi => ({
            type: 'Feature', // 要素类型
            geometry: {
                type: 'Point', // 几何类型为点
                coordinates: wifi.coordinates // 点坐标 [经度, 纬度]
            },
            properties: {
                id: wifi.id, // WiFi点ID
                type: wifi.type, // WiFi点类型
                ssid: wifi.ssid, // WiFi名称
                signalQuality: wifi.signalQuality, // 信号质量(%)
                operator: wifi.operator, // 运营商
                selected: wifi.selected, // 是否选中
                cz: wifi.cz // 操作
            }
        }))
    };
    
    console.log('WiFi GeoJSON数据:', geoJsonData);
    console.log('WiFi数据源是否存在:', !!map.getSource('wifi-source'));
    
    // 更新数据源数据
    if (map.getSource('wifi-source')) {
        map.getSource('wifi-source').setData(geoJsonData); // 设置数据
        console.log('WiFi数据已加载到地图');
        
        // 检查图层是否存在
        setTimeout(() => {
            console.log('WiFi图层检查:');
            console.log('- wifi-clusters图层:', !!map.getLayer('wifi-clusters'));
            console.log('- wifi-cluster-count图层:', !!map.getLayer('wifi-cluster-count'));
            console.log('- wifi-points图层:', !!map.getLayer('wifi-points'));
            console.log('- WIFI_ICON图标:', !!map.hasImage('WIFI_ICON'));
        }, 500);
    } else {
        console.error('WiFi数据源不存在，无法加载数据');
    }
};

/**
 * 设置WiFi图层点击事件监听
 * @param map 地图实例
 */
const setWifiClickListener = (map: any) => {
    // WiFi点击事件
    map.on('click', 'wifi-points', (e: any) => {
        if (e.defaultPrevented) return; // 如果事件已被阻止默认行为则返回
        
        const clickedFeature = e.features[0]; // 获取点击的第一个要素
        if (clickedFeature) {
            // 清除之前的选择
            // clearSelect(map);
            
            // 设置弹窗内容
            // 定义WiFi属性映射关系
            const wifiMapping = {
                id: 'ID', // ID字段映射
                ssid: 'WiFi名称', // SSID字段映射
                signalQuality: '信号质量(%)', // 信号质量字段映射
                operator: '运营商', // 运营商字段映射
                cz: '操作' // 操作字段映射
            };
            
            const infos = [{
                name: 'WiFi点信息', // 信息面板标题
                properties: clickedFeature.properties, // 要素属性
                mapping: wifiMapping // 属性映射
            }];
            
            const popupInfo = {
                infos: infos, // 弹窗信息
                option: null, // 弹窗选项
                lnglat: e.lngLat // 点击位置经纬度
            };
            
            bStore.setPopupInfo(popupInfo); // 设置弹窗信息到全局状态
            removeClickedFeas(map); // 移除已点击的要素
            
            // 高亮选中的WiFi点
            const hoveredWifiId = clickedFeature.properties.id; // 获取WiFi点ID
            highlightWifiPoint(map, hoveredWifiId); // 高亮显示
        }
        e.preventDefault(); // 阻止默认行为
    });

    // WiFi聚合点击事件
    map.on('click', 'wifi-clusters', (e: any) => {
        if (e.defaultPrevented) return; // 如果事件已被阻止默认行为则返回
        
        // 查询点击位置的聚合要素
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['wifi-clusters'] // 查询WiFi聚合图层
        });
        const clusterId = features[0].properties.cluster_id; // 获取聚合ID
        
        // 获取聚合展开的缩放级别并移动到该位置
        map.getSource('wifi-source').getClusterExpansionZoom(
            clusterId,
            (err: any, zoom: number) => {
                if (err) return; // 如果出错则返回
                map.easeTo({
                    center: features[0].geometry.coordinates, // 中心点坐标
                    zoom: zoom // 缩放级别
                });
            }
        );
        e.preventDefault(); // 阻止默认行为
    });

    // 鼠标悬停效果
    map.on('mouseenter', 'wifi-points', () => {
        map.getCanvas().style.cursor = 'pointer'; // 设置鼠标为手型
    });

    map.on('mouseleave', 'wifi-points', () => {
        map.getCanvas().style.cursor = ''; // 恢复默认鼠标样式
    });

    map.on('mouseenter', 'wifi-clusters', () => {
        map.getCanvas().style.cursor = 'pointer'; // 设置鼠标为手型
    });

    map.on('mouseleave', 'wifi-clusters', () => {
        map.getCanvas().style.cursor = ''; // 恢复默认鼠标样式
    });
};

/**
 * 高亮WiFi点
 * @param map 地图实例
 * @param wifiId WiFi点ID
 */
const highlightWifiPoint = (map: any, wifiId: string) => {
    if (map.getLayer('wifi-points')) {
        // 根据ID设置图标样式，匹配的使用高亮图标，不匹配的使用默认图标
        map.setLayoutProperty('wifi-points', 'icon-image', [
            'case',
            ['match', ['get', 'id'], wifiId, true, false],
            'WIFI_ICON_H', // 高亮图标
            'WIFI_ICON'    // 默认图标
        ]);
    }
};

/**
 * 控制WiFi图层显示/隐藏
 * @param map 地图实例
 * @param visible 是否显示
 */
const setWifiLayerVisible = (map: any, visible: boolean) => {
    const visibility = visible ? 'visible' : 'none'; // 根据参数确定可见性
    
    // 设置各个WiFi相关图层的可见性
    if (map.getLayer('wifi-clusters')) {
        map.setLayoutProperty('wifi-clusters', 'visibility', visibility); // 聚合图层
    }
    if (map.getLayer('wifi-cluster-count')) {
        map.setLayoutProperty('wifi-cluster-count', 'visibility', visibility); // 聚合数量图层
    }
    if (map.getLayer('wifi-points')) {
        map.setLayoutProperty('wifi-points', 'visibility', visibility); // 单点图层
    }
};

export {
    initMap,
    addVecWMTSLayer,
    addRasterWMTSLayer,
    setLyrVisible,
    removeLayerById,
    removeAllLayers,
    setLayerCursor,
    setLayerListen,
    removeListen,
    setCtxtListen,
    loadLocalGeojson,
    addClusterPointLayer,
    setClusterListen,
    addGeoJsonLayer,
    removeClickedFeas,
    moveLayer,
    moveLayerAll,
    setLayerVisible,
    // WiFi相关功能
    initWifiLayer,
    loadWifiData,
    setWifiClickListener,
    setWifiLayerVisible
}