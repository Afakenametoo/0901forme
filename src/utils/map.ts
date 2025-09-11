import mapboxgl, {LngLatBounds} from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import {mStyle} from "@/styles/utils/style";
import {baseStore} from "@/stores";
import {setRemoveBoxSelect} from '@/stores/globalBoxSelect';
import {ElMessage, ElPagination} from 'element-plus';
import * as turf from '@turf/turf';
import {removeGlobalNode} from "element-plus/es/utils";
import {specialLayer} from "@/data/layerConfig";

const baseUrl = 'http://192.168.31.183:8183'

//初始化地图
const initMap = () => {
    //去除token
    mapboxgl.accessToken = 'pk.eyJ1IjoiZmdqaXBvbW0iLCJhIjoiY21kYnVpczRiMTBydzJpcHpibnE5N2p5dCJ9.2erVYw5qSP341CeeigQUFw'

    class Cjmapbox extends mapboxgl.Map {
        __proto__: any;
    }

    Cjmapbox.prototype.__proto__._authenticate = function () {
        return true
    }
    // 创建地图实例
    const map = new mapboxgl.Map({
        container: 'baseMap',
        center: [120.868041, 29.513075],
        // style: mStyle,
        attributionControl: false,
        zoom: 16, //图层
        pitch: 0, //地图倾斜
        maxZoom: 20, //最大图层
        minZoom: 8, //最小图层,
        // renderWorldCopies: true
        preserveDrawingBuffer: true  //需要使用html2canvas插件截图，则需开启该功能
    })
    //加载基础底图：天地图在线资源
    const tdtToken = '88ee1e6bc55dfee4b2c8fbc05d6b2efc'  //f23264ec7d30cc186eecde88c70d971f
    const baseImgLyrs = [
        // 矢量底图
        {
            name: 'vec_w',
            url: "http://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&tk=" + tdtToken,
            // url: "http://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}",
            // url:`http://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=${tdtToken}`,
            // url: "/tiles/sl/vec_w/{z}/{y}/{x}.png",
            show: true
        },
        {
            name: 'cva_w',
            // url: "/tiles/sl/cva_w/{z}/{y}/{x}.png",
            // url: `http://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=${tdtToken}`,
            url: "http://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&tk=" + tdtToken,
            show: true,
        }
    ]
    map.on('load', () => {
        baseImgLyrs.forEach(lyr => {
            addRasterWMTSLayer(map, lyr)
        })
        // 加载图标（确保你提供的是支持的图片格式，SVG 不支持）
        if (!map.hasImage('YS')) {
            map.loadImage('src/assets/YS.png', (error: any, image: any) => {
                if (error) throw error; // 如果加载失败则抛出错误
                if (image) map.addImage('YS', image);  // 添加图标到 Mapbox
            });
        }
        if (!map.hasImage('WS')) {
            map.loadImage('src/assets/WS.png', (error: any, image: any) => {
                if (error) throw error; // 如果加载失败则抛出错误
                if (image) map.addImage('WS', image);  // 添加图标到 Mapbox
            });
        }
        if (!map.hasImage('WS_H')) {
            map.loadImage('src/assets/WS_H.png', (error: any, image: any) => {
                if (error) throw error; // 如果加载失败则抛出错误
                if (image) map.addImage('WS_H', image);  // 添加图标到 Mapbox
            });
        }
        if (!map.hasImage('YS_H')) {
            map.loadImage('src/assets/YS_H.png', (error: any, image: any) => {
                if (error) throw error; // 如果加载失败则抛出错误
                if (image) map.addImage('YS_H', image);  // 添加图标到 Mapbox
            });
        }
        // 创建简单的WiFi图标
        if(!map.hasImage('WIFI_ICON')){
            // 创建一个简单但醒目的WiFi图标
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // 绘制绿色圆形背景
                ctx.fillStyle = '#00A86B';
                ctx.beginPath();
                ctx.arc(16, 16, 15, 0, 2 * Math.PI);
                ctx.fill();
                
                // 绘制白色边框
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(16, 16, 15, 0, 2 * Math.PI);
                ctx.stroke();
                
                // 绘制大号"W"字符
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('W', 16, 16);
                
                const imageData = ctx.getImageData(0, 0, 32, 32);
                map.addImage('WIFI_ICON', imageData);
                console.log('WiFi图标创建成功');
            }
        }
        
        // 创建WiFi高亮图标
        if (!map.hasImage('WIFI_ICON_H')) {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // 绘制金色圆形背景
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(16, 16, 15, 0, 2 * Math.PI);
                ctx.fill();
                
                // 绘制黑色边框
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(16, 16, 15, 0, 2 * Math.PI);
                ctx.stroke();
                
                // 绘制大号"W"字符
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('W', 16, 16);
                
                const imageData = ctx.getImageData(0, 0, 32, 32);
                map.addImage('WIFI_ICON_H', imageData);
                console.log('WiFi高亮图标创建成功');
            }
        }
    })
    map._logoControl && map.removeControl(map._logoControl) //去除mapbox logo
    map.addControl(new mapboxgl.ScaleControl())
    return map
}

//添加wmts影像瓦片图层
const addRasterWMTSLayer = (map: any, item: any) => {
    if (item.name && item.url) {
    // 数据源不存在时才创建
    if (!map.getSource(item.name)) {
      map.addSource(item.name, {
        type: 'raster',
        tiles: [item.url],
        tileSize: 256,
      });
    }
    // 图层不存在时才创建
    if (!map.getLayer(item.name)) {
      map.addLayer({
        id: item.name,
        type: 'raster',
        source: item.name,
        'source-layer': item.name,
        layout: { visibility: 'visible' } // 默认可见
      });
    }
  }
    map.on('zoom', () => {
        const zoom = map.getZoom();
        if (zoom > map.getMaxZoom()) {
            map.setZoom(map.getMaxZoom() - 1, {duration: 0});
            map.once('zoomend', () => {
                map.setLayoutProperty(item.name, 'visibility', 'none');
                map.setZoom(map.getMaxZoom());
                map.setLayoutProperty(item.name, 'visibility', 'visible')
            })
        }
    })
}

/**
 * @description: 根据类型加载图层
 * @param {any} map
 * @param {any} item
 * @param {any} type
 * @return {*}
 */
const addVecWMTSLayer = (map: any, item: any) => {
    if (item.name && map) {
        if (!map.getSource(item.name) && item.url) {
            map.addSource(item.name, {
                type: 'vector',
                tiles: [import.meta.env.VITE_BASE + item.url]
            });
        }
        if (!map.getLayer(item.name)) {
            map.addLayer({
                'id': item.name,
                'type': item.type,
                'source': item.source || item.name,
                'source-layer': item.source || item.name,
                'paint': item.style || {},
                'layout': item.layout || {},
            });
        }
        // 如果指定了中心点，则平移到指定位置
        if (item.center) {
            map.flyTo({
                center: item.center,
                zoom: item.zoom,
                speed: 2,
                curve: 1,
                easing(t: number) {
                    return t;
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
    const {beforeId = null} = options;
    if (item.name && map) {
        // 1. 加载数据源
        if (map.getSource(item.name) == undefined && item.data) {
            map.addSource(item.name, {
                type: 'geojson',
                data: item.data
            });
        }
        if (!map.getLayer(item.name)) {
            // 2. 加载地图图层，控制显示隐藏
            map.addLayer({
                id: item.name,
                type: item.type,
                source: item.source || item.name,
                paint: item.style || {},
                layout: item.layout || {}
            }, beforeId);
        } else {
            map.setLayoutProperty(item.name, 'visibility', 'visible');
        }
    }
};

// 添加聚合点图层
const addClusterPointLayer = (map: any, item: any, options: { beforeId?: string | null } = {}) => {
    const {beforeId = null} = options;
    if (item.name && map) {
        // 1.加载数据源
        if (map.getSource(item.name) == undefined && item.url) {
            map.addSource(item.name, {
                type: 'geojson',
                data: item.url,
                cluster: true,
                // clusterMaxZoom: 10,
                clusterRadius: 50
            })
        }
        // 添加非聚合图层
        if (!map.getLayer(item.name)) {
            map.addLayer({
                'id': item.name,
                'type': item.type,
                'source': item.source || item.name,
                'filter': item.filter,
                'paint': item.style || {},
                'layout': item.layout || {}
            }, beforeId);
        } else {
            map.setLayoutProperty(item.name, 'visibility', 'visible')
        }
        // 添加聚合图层
        if (!map.getLayer(item.name + "_cluster")) {
            map.addLayer({
                'id': item.name + "_cluster",
                'type': "circle",
                'source': item.source || item.name,
                'filter': ["has", "point_count"],
                'paint': {
                    "circle-color": [
                        "step",
                        ["get", "point_count"],
                        "#51bbd6",
                        20,
                        "#f1f075",
                        50,
                        "#f28cb1",
                    ],
                    "circle-radius": ["step", ["get", "point_count"], 12, 12, 16, 20, 25],
                },
            }, beforeId)
        } else {
            map.setLayoutProperty(item.name + "_cluster", 'visibility', 'visible')
        }
        // 添加聚合数量图层
        if (!map.getLayer(item.name + "_cluster_count")) {
            map.addLayer({
                'id': item.name + "_cluster_count",
                'type': "symbol",
                'source': item.source || item.name,
                'filter': ["has", "point_count"],
                'layout': {
                    "text-field": ["get", "point_count_abbreviated"],
                    "text-size": 12,
                },
            }, beforeId)
        } else {
            map.setLayoutProperty(item.name + "_cluster_count", 'visibility', 'visible')
        }
    }
}

//移除所有图层
const removeAllLayers = (map: any) => {
    var layers = map.getStyle().layers
    if (layers.length > 0) {
        layers.forEach((lyr: any) => {
            map.removeLayer(lyr.id)
        })
    }
}

//根据图层id设置显隐
const setLyrVisible = (map: any, id: string, visible: boolean) => {
    if (visible) {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible')
    } else {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none')
    }
}

//根据id移除图层
const removeLayerById = (map: any, id: string) => {
    if (map.getLayer(id))
        map.removeLayer(id)
    if (map.getSource(id))
        map.removeSource(id)
}

// 图层位置变换，id越靠后，位置越靠上
const moveLayer = (map: any, idArr: Array<string>) => {
    if (idArr.length > 0) {
        idArr.forEach(id => {
            if (map.getLayer(id)) {
                map.moveLayer(id)
            }
        })
    }
}

const moveLayerAll = (map: any) => {
    const arr = ['WS_LINE', 'YS_LINE', 'WS_LINE_dashed', 'YS_LINE_dashed', 'WS_POINT_cluster', 'WS_POINT_cluster_count', 'YS_POINT_cluster',
        'YS_POINT_cluster_count', 'WS_POINT', 'YS_POINT', 'WS_POINT_label', 'YS_POINT_label']
    arr.forEach(id => {
        if (map.getLayer(id)) {
            map.moveLayer(id)
        }
    })
}

const onMouseMove = (e: any) => {
    bStore.boxMap.getCanvas().style.cursor = 'pointer';
};

const onMouseLeave = (e: any) => {
    bStore.boxMap.getCanvas().style.cursor = 'grab';
};

const setLayerCursor = (map: any, id: string, set: boolean) => {
    if (map.getLayer(id)) {
        //console.log("id",id);
        if (set) {
            map.on('mousemove', id, onMouseMove);
            map.on('mouseleave', id, onMouseLeave);
        } else {
            map.off('mousemove', id, onMouseMove); // 确保解绑的是同一函数
            map.off('mouseleave', id, onMouseLeave);
        }
    }
};


// 弹窗相关功能函数
const bStore = baseStore()

let defaultPopup = {
    infos: null,
    option: null
}
let mapListeners: any = []
let flowLayers: any = []
let clusterListeners: any = []
// 设置监听事件
const setLayerListen = (map: any, mapping: any, layer: any) => {
    const listen = async (e: any) => {
        if (e.defaultPrevented) return;
        // 1.获取点中feature
        let clickedFeature = e.features[0]
        if (clickedFeature) {
            clearSelect(map)
            // 2. 设置弹窗内容
            const infos = [{
                name: layer.name,
                properties: clickedFeature.properties,
                mapping: mapping
            }]
            let popupInfo = {
                infos: infos,
                option: null,
                lnglat: e.lngLat
            }
            bStore.setPopupInfo(popupInfo)
            removeClickedFeas(map)
            const hoveredPolygonId = e.features[0].properties.ObjectID
            // 3.设置高亮图层
            addSelect(map, layer, hoveredPolygonId)
            // 4.设置流向动画
            if (layer.type === 'line') {
                let tempFlow = {
                    type: 'line',
                    name: 'GXSS_LINE_dashed',
                    data: clickedFeature,
                    alias: '管线设置',
                    style: {
                        'line-color': '#a616f2',
                        'line-width': 4.5,
                        'line-opacity': [
                            "step",
                            ["zoom"],
                            0,
                            16,
                            1
                        ]
                    }
                }
                addGeoJsonLayer(map, tempFlow)
                flowLayers.push(tempFlow)
                clickAnimateDashArray(0, tempFlow.name)
            }
        }
        e.preventDefault()
    }
    //地图上左键击中图层
    map.on('click', layer.name, listen)
    //对工程红线图层设置监听事件
    mapListeners[layer.name] = listen
}


const setClusterListen = (map: any, name: any) => {
    const listen = (e: any) => {
        if (e.defaultPrevented) return;
        const features = map.queryRenderedFeatures(e.point, {
            layers: [name + "_cluster"]
        });
        const clusterId = features[0].properties.cluster_id;
        map.getSource(name).getClusterExpansionZoom(
            clusterId,
            (err: any, zoom: number) => {
                if (err) return;
                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
        e.preventDefault()
    }
    clusterListeners[name + "_cluster"] = listen
    map.on('click', name + "_cluster", listen)
}

// 选中高亮样式
const addSelect = (map: any, layer: any, selectId: any) => {
    if (layer.type === 'symbol') {
        if (layer.name == 'WS_POINT') {
            map.setLayoutProperty(layer.name, 'icon-image', [
                'case',
                [
                    'match',
                    ['get', 'ObjectID'],
                    selectId,
                    true,
                    false
                ],
                'WS_H',
                'WS'
            ])
        } else if (layer.name == 'YS_POINT') {
            map.setLayoutProperty(layer.name, 'icon-image', [
                'case',
                [
                    'match',
                    ['get', 'ObjectID'],
                    selectId,
                    true,
                    false
                ],
                'YS_H',
                'YS'
            ])
        }
        else if(layer.name==="WIFI_POINT"){
            map.setLayoutProperty(layer.name, 'icon-image', [
                'case',
                ['match', ['get', 'id'], selectId, true, false],
                'WIFI_ICON_H', // 高亮图标
                'WIFI_ICON'    // 默认图标
            ]);
        }
    } else {
        if (layer.name === 'YS_LINE') {
            map.setPaintProperty(layer.name, 'line-color', [
                'case',
                [
                    'match',
                    ['get', 'ObjectID'],
                    selectId,
                    true,
                    false
                ],
                '#f2fe60',
                '#314ee6'
            ])
        } else if (layer.name === 'WS_LINE') {
            map.setPaintProperty(layer.name, 'line-color', [
                'case',
                [
                    'match',
                    ['get', 'ObjectID'],
                    selectId,
                    true,
                    false
                ],
                '#f2fe60',
                '#ec682c'
            ])
        }
    }
}

// 恢复选中样式
const clearSelect = (map: any) => {
    if (map.getLayer('YS_LINE')) {
        map.setPaintProperty('YS_LINE', 'line-color', '#0000ff')
    }
    if (map.getLayer('WS_LINE')) {
        map.setPaintProperty('WS_LINE', 'line-color', '#fe5708')
    }
    if (map.getLayer('WS_POINT')) {
        map.setLayoutProperty('WS_POINT', 'icon-image', 'WS')
    }
    if (map.getLayer('YS_POINT')) {
        map.setLayoutProperty('YS_POINT', 'icon-image', 'YS')
    }

}

//右键清除计算结果
const setCtxtListen = (map: any, keyword: string) => {
    //地图上右键初始化
    map.on('contextmenu', (e: any) => {
        //清除所有相关图层，关闭计算窗口和popup
        bStore.setPopupInfo(defaultPopup)
        //移除高亮图斑
        removeClickedFeas(map)
        // 清除选中高亮图斑
        clearSelect(map)
        //移除地图上所有图层
        //todo  way2:获取elements打勾的值
        let layers = map.getStyle().layers
        layers.forEach((lyr: any) => {
            if (lyr.id.includes(keyword)) {
                removeLayerById(map, lyr.id.split('-')[0] + '_label')
                removeLayerById(map, lyr.id)
                bStore.removeUncheckedLayer(lyr.id)
            }
        })
    })
}

// 移除监听事件
const removeListen = (map: any, layerName: string) => {
    if (mapListeners[layerName]) {
        map.off('click', layerName, mapListeners[layerName])
    }
}

// 移除全部点击的要素，exe为例外的图层
const removeClickedFeas = async (map: any) => {
    if (flowLayers.length > 0) {
        flowLayers.forEach(function (lyr: any) {
            removeLayerById(map, lyr.name)
        })
    }
    // 清除动画
    if (animationId != -1) {
        cancelAnimationFrame(animationId)
        animationId = -1
    }
}

/**
 * @description: 雨水管线流向动画
 * @param {*} timestamp
 * @param {*} layerName
 * @return {*}
 */
function animateDashArray(timestamp: number) {
    // Update line-dasharray using the next value in dashArraySequence. The
    // divisor in the expression `timestamp / 50` controls the animation speed.
    const newStep = parseInt(String((timestamp / 50) % dashArraySequence.length));
    if (newStep !== step) {
        toRaw(bStore.boxMap).setPaintProperty(
            'YS_LINE_dashed',
            "line-dasharray",
            dashArraySequence[step]
        );
        step = newStep;
    }
    animationId = requestAnimationFrame(animateDashArray);
}

/**
 * @description: 控制label图层、流向图层显隐
 * @param {*} value  true||false
 * @param {*} dataName  二级目录名称
 * @return {*}
 */
const setLayerVisible = (value: number, dataName: string, type: string) => {
    const visibility = value ? "visible" : "none"
    const layerName = type === 'label' ? dataName + '_label' : dataName + '_dashed'
    if (toRaw(bStore.boxMap).getLayer(layerName))
        toRaw(bStore.boxMap).setLayoutProperty(layerName, "visibility", visibility)
    if (type == 'flow') {
        if (dataName.includes('YS')) {
            if (value) animateDashArray(0)
            else {
                cancelAnimationFrame(animationId)
                animationId = -1
            }
        } else if (dataName.includes('WS')) {
            if (value) animateDashArray2(0)
            else {
                cancelAnimationFrame(animationId2)
                animationId2 = -1
            }
        }
    }
}

let step2 = 0;
let animationId2 = -1;

function animateDashArray2(timestamp: number) {
    const newStep = parseInt(String((timestamp / 50) % dashArraySequence.length));
    if (newStep !== step2) {
        toRaw(bStore.boxMap).setPaintProperty(
            'WS_LINE_dashed',
            "line-dasharray",
            dashArraySequence[step2]
        );
        step2 = newStep;
    }
    animationId2 = requestAnimationFrame(animateDashArray2);
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
];


let step = 0;
let animationId = -1;

function clickAnimateDashArray(timestamp: number, layerName: string) {
    // Update line-dasharray using the next value in dashArraySequence. The
    // divisor in the expression `timestamp / 50` controls the animation speed.
    const newStep = parseInt(String((timestamp / 50) % dashArraySequence.length));
    if (newStep !== step) {
        toRaw(bStore.boxMap).setPaintProperty(
            layerName,
            "line-dasharray",
            dashArraySequence[step]
        );
        step = newStep;
    }
    console.log(layerName)
    // Request the next frame of the animation.
    animationId = requestAnimationFrame(function (timestamp) {
        clickAnimateDashArray(timestamp, layerName)
    });
}

// 加载静态geojson数据
const loadLocalGeojson = async (path: any) => {
    const res = await fetch(path);
    const data = await res.json();
    return data
}

// ==================== WiFi相关功能函数 ====================

/**
 * 初始化WiFi图层
 * @param map 地图实例
 */
const initWifiLayer = (map: any) => {
    // 添加WiFi数据源 - 优化聚合设置
    if (!map.getSource('wifi-source')) {
        map.addSource('wifi-source', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            },
            cluster: true,
            clusterMaxZoom: 16,  // 在更高的缩放级别（18）才停止聚合，让聚合效果更持久
            clusterRadius: 45    // 增大聚合半径，让更多点聚合在一起
        });
        console.log('WiFi数据源已创建，优化聚合设置: maxZoom=18, radius=50');
    }

    // 添加WiFi聚合圆点图层 - 参考示例代码优化样式
    if (!map.getLayer('wifi-clusters')) {
        map.addLayer({
            id: 'wifi-clusters',
            type: 'circle',
            source: 'wifi-source',
            filter: ['has', 'point_count'],
            paint: {
                // 参考示例的配色方案，根据聚合数量动态调整颜色
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6',    // 少于10个点：浅蓝色
                    10,
                    '#f1f075',    // 10-20个点：黄色  
                    20,
                    '#f28cb1',    // 20-75个点：粉色
                    75,
                    '#ac41bf'     // 75个以上：紫色
                ],
                'circle-opacity': 0.8,
                // 参考示例的半径设置，根据点数量动态调整大小
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    12,    // 基础大小：12px
                    2,
                    15,    // 2个以上：15px
                    10,
                    20,    // 10个以上：20px
                    20,
                    25,    // 20个以上：25px
                    50,
                    30,    // 50个以上：30px
                    100,
                    35     // 100个以上：35px
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
    }

    // 添加WiFi聚合数量文字图层 - 优化字体和大小
    if (!map.getLayer('wifi-cluster-count')) {
        map.addLayer({
            id: 'wifi-cluster-count',
            type: 'symbol',
            source: 'wifi-source',
            filter: ['>', ['get', 'point_count'], 1],  // 只显示大于1个点的聚合数量
            layout: {
                'text-field': '{point_count}',  // 显示完整数字，不使用缩写
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],  // 参考示例字体
                'text-size': 14
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1
            }
        });
    }

    // 添加WiFi单点图层 - 优化图标大小
    if (!map.getLayer('wifi-points')) {
        map.addLayer({
            id: 'wifi-points',
            type: 'symbol',
            source: 'wifi-source',
            filter: ['!', ['has', 'point_count']],
            layout: {
                'icon-image': 'WIFI_ICON',
                'icon-size': 0.6,  // 适当增大单点图标
                'icon-anchor': 'center',
                'icon-allow-overlap': true,
                'visibility': 'visible'
            },
            paint: {
                'text-color': '#000000',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1
            }
        });
    }
    
    // 确保聚合图层可见
    if (map.getLayer('wifi-clusters')) {
        map.setLayoutProperty('wifi-clusters', 'visibility', 'visible');
    }
    if (map.getLayer('wifi-cluster-count')) {
        map.setLayoutProperty('wifi-cluster-count', 'visibility', 'visible');
    }
    if (map.getLayer('wifi-points')) {
        map.setLayoutProperty('wifi-points', 'visibility', 'visible');
    }
};

/**
 * 加载WiFi点数据到地图
 * @param map 地图实例
 * @param wifiData WiFi数据数组
 */
const loadWifiData = (map: any, wifiData: any[]) => {
    if (!map.getSource('wifi-source')) {
        console.log('初始化WiFi图层...');
        initWifiLayer(map);
    }
    
    const geoJsonData = {
        type: 'FeatureCollection',
        features: wifiData.map(wifi => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: wifi.coordinates
            },
            properties: {
                id: wifi.id,
                type: wifi.type,
                ssid: wifi.ssid,
                signalQuality: wifi.signalQuality,
                operator: wifi.operator,
                selected: wifi.selected,
                cz: wifi.cz
            }
        }))
    };
    
    console.log('WiFi GeoJSON数据:', geoJsonData);
    console.log('WiFi数据源是否存在:', !!map.getSource('wifi-source'));
    
    if (map.getSource('wifi-source')) {
        map.getSource('wifi-source').setData(geoJsonData);
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
        if (e.defaultPrevented) return;
        
        const clickedFeature = e.features[0];
        if (clickedFeature) {
            // 清除之前的选择
            // clearSelect(map);
            
            // 设置弹窗内容
            const wifiMapping = {
                id: 'ID',
                ssid: 'WiFi名称',
                signalQuality: '信号质量(%)',
                operator: '运营商',
                cz: '操作'
            };
            
            const infos = [{
                name: 'WiFi点信息',
                properties: clickedFeature.properties,
                mapping: wifiMapping
            }];
            
            const popupInfo = {
                infos: infos,
                option: null,
                lnglat: e.lngLat
            };
            
            bStore.setPopupInfo(popupInfo);
            removeClickedFeas(map);
            
            // 高亮选中的WiFi点
            const hoveredWifiId = clickedFeature.properties.id;
            highlightWifiPoint(map, hoveredWifiId);
        }
        e.preventDefault();
    });

    // WiFi聚合点击事件
    map.on('click', 'wifi-clusters', (e: any) => {
        if (e.defaultPrevented) return;
        
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['wifi-clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        
        map.getSource('wifi-source').getClusterExpansionZoom(
            clusterId,
            (err: any, zoom: number) => {
                if (err) return;
                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
        e.preventDefault();
    });

    // 鼠标悬停效果
    map.on('mouseenter', 'wifi-points', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'wifi-points', () => {
        map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'wifi-clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'wifi-clusters', () => {
        map.getCanvas().style.cursor = '';
    });
};

/**
 * 高亮WiFi点
 * @param map 地图实例
 * @param wifiId WiFi点ID
 */
const highlightWifiPoint = (map: any, wifiId: string) => {
    // 这里可以添加高亮逻辑，比如改变图标
    console.log('高亮WiFi点:', wifiId);
};

/**
 * 控制WiFi图层显示/隐藏
 * @param map 地图实例
 * @param visible 是否显示
 */
const setWifiLayerVisible = (map: any, visible: boolean) => {
    const visibility = visible ? 'visible' : 'none';
    
    if (map.getLayer('wifi-clusters')) {
        map.setLayoutProperty('wifi-clusters', 'visibility', visibility);
    }
    if (map.getLayer('wifi-cluster-count')) {
        map.setLayoutProperty('wifi-cluster-count', 'visibility', visibility);
    }
    if (map.getLayer('wifi-points')) {
        map.setLayoutProperty('wifi-points', 'visibility', visibility);
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
