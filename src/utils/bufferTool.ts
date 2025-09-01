/*
 * @Author: Sleip
 * @Date: 2025-02-21 15:07:25
 * @LastEditors: Sleip
 * @LastEditTime: 2025-03-03 08:36:03
 * @FilePath: \underground_pipelines_display\src\utils\BufferTool.ts
 * @Description: 缓冲区功能工具类
 * 
 * Copyright (c) 2025 by Sleip, All Rights Reserved. 
 */
import mapboxgl from 'mapbox-gl';
import turfBuffer from '@turf/buffer';
import turfWithin from '@turf/within';
import turfBooleanContains from '@turf/boolean-contains';
import { point, featureCollection, lineString, distance, centroid, booleanIntersects } from '@turf/turf';
import { baseStore, layerStore, statisticsStore } from "@/stores";
import { ElNotification, ElLoading } from "element-plus";
import axios from 'axios';
import * as turf from '@turf/turf';
import RBush from 'rbush';

const bStore = baseStore();
const store = layerStore();
const sStore = statisticsStore();

export default class BufferTool {
    map: mapboxgl.Map;
    bufferDistance: number;
    bufferLayerIds: string[] = []; // 用于存储缓冲区图层ID
    bufferCenters: { [layerId: string]: number[] } = {}; // 用于存储缓冲区中心点
    clickListener: ((e: mapboxgl.MapMouseEvent) => void) | null = null; // 用于存储点击事件监听器
    statisticsNotification: any | null = null; // 用于存储统计结果通知的实例

    filteredRelevantFeatures: turf.Feature[] = [];

    constructor() {
        this.map = bStore.boxMap;
        this.bufferDistance = 0;
        this.statisticsNotification = null;
        console.log('BufferTool initialized with map:', this.map);
    }

    /**
     * @description: 创建缓冲区
     * @param {string} layerId 图层ID
     * @param {number} distance 缓冲区距离（米）
     * @param {number[]} coordinates 点的坐标
     * @return {*}
     */
    createBuffer(layerId: string, distance: number, coordinates: number[]) {
        console.log('createBuffer called with layerId:', layerId, 'distance:', distance, 'coordinates:', coordinates);
        const pointFeature = point(coordinates); // 使用提供的坐标
        const bufferFeature = turfBuffer(pointFeature, distance / 1000, { units: 'kilometers' });

        // 保存缓冲区中心点
        this.bufferCenters[layerId] = coordinates;

        // 添加缓冲区到地图
        if (this.map.getLayer(layerId)) {
            this.map.removeLayer(layerId);
        }
        this.map.addLayer({
            id: layerId,
            type: 'fill',
            source: {
                type: 'geojson',
                data: bufferFeature
            },
            paint: {
                'fill-color': 'blue',
                'fill-opacity': 0.5
            }
        });

        if (this.map.getLayer(`${layerId}-outline`)) {
            this.map.removeLayer(`${layerId}-outline`);
        }
        this.map.addLayer({
            id: `${layerId}-outline`,
            type: 'line',
            source: {
                type: 'geojson',
                data: bufferFeature
            },
            paint: {
                'line-color': 'blue',
                'line-width': 2
            }
        });

        // 存储缓冲区图层ID
        this.bufferLayerIds.push(layerId, `${layerId}-outline`);
    }

    /**
     * @description: 开始创建缓冲区
     * @param {number} distance 缓冲区距离（米）
     * @return {*}
     */
    startCreatingBuffer(distance: number) {
        this.bufferDistance = distance;
        console.log('startCreatingBuffer called with distance:', distance);

        // 改变鼠标指针样式
        this.map.getCanvas().style.cursor = 'crosshair';

        // 定义点击事件处理函数
        const handleClick = (e: mapboxgl.MapMouseEvent) => {
            console.log('Map clicked at:', e.lngLat.toArray());
            const coordinates = e.lngLat.toArray();
            const layerId = "buffer_" + String(new Date().getTime());
            this.createBuffer(layerId, this.bufferDistance, coordinates);

            // 移除点击事件监听器
            if (this.clickListener) {
                this.map.off('click', this.clickListener);
                this.clickListener = null;
            }

            // 恢复鼠标指针样式
            this.map.getCanvas().style.cursor = '';
        };

        // 添加点击事件监听器
        this.clickListener = handleClick;
        this.map.on('click', handleClick);
    }

    /**
     * @description: 清除所有缓冲区图层
     * @return {*}
     */
    clearBuffers() {
        console.log('clearBuffers called');
        this.bufferLayerIds.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
        });
        this.bufferLayerIds = []; // 清空缓冲区图层ID列表
        this.bufferCenters = {}; // 清空缓冲区中心点列表

        // 移除点击事件监听器
        if (this.clickListener) {
            this.map.off('click', this.clickListener);
            this.clickListener = null;
        }

        // 恢复鼠标指针样式
        this.map.getCanvas().style.cursor = '';

        // 关闭显示统计结果的窗口
        if (this.statisticsNotification) {
            this.statisticsNotification.close();
            this.statisticsNotification = null;
        }
    }


    /**
     * @description: 将 MultiLineString 转换为多个 LineString
     * @param {turf.MultiLineString} multiLineString
     * @param {turf.Properties} properties
     * @return {turf.Feature[]} 返回多个 LineString 的 Feature 数组
     */
    multiLineStringToLineStrings(multiLineString: turf.MultiLineString, properties: turf.Properties): turf.Feature[] {
        return multiLineString.coordinates.map(coordinates => {
            return lineString(coordinates, properties);
        });
    }

    /**
     * @description: 计算缓冲区内的点或线元素
     * @return {*}
     */
    async calculateBuffer() {
        console.log('calculateBuffer called');

        // 显示等待动画
        const loading = ElLoading.service({
            lock: true,
            text: '计算中...',
            background: 'rgba(0, 0, 0, 0.5)',
        });

        try {
            // 获取所有带“WS”或“YS”的图层
            const relevantLayers = this.getRelevantLayers(this.map);

            if (relevantLayers.length === 0) {
                console.log('No relevant layers found');
                ElNotification({
                    title: '统计结果',
                    message: '未找到相关图层',
                    position: 'bottom-right',
                    duration: 0,
                    type: 'warning',
                    offset: 50
                });
                loading.close();
                return;
            }

            // 获取所有缓冲区图层
            const bufferLayers = this.getBufferLayers(this.bufferLayerIds, this.map);

            if (bufferLayers.length === 0) {
                console.log('No buffer layers found');
                ElNotification({
                    title: '统计结果',
                    message: '未找到缓冲区图层',
                    position: 'bottom-right',
                    duration: 0,
                    type: 'warning',
                    offset: 50
                });
                loading.close();
                return;
            }

            // 并行获取所有相关图层的数据
            const relevantFeaturesPromises = relevantLayers.map(layer => this.getRelevantFeatures(layer));
            const relevantFeatures = (await Promise.all(relevantFeaturesPromises)).flat();

            // 获取所有缓冲区图层的数据
            const bufferFeatures = this.getBufferFeatures(bufferLayers);

            // 确保 relevantFeatures 和 bufferFeatures 都是有效的 Feature 数组
            if (relevantFeatures.length === 0 || bufferFeatures.length === 0) {
                console.error('No valid features found for analysis');
                ElNotification({
                    title: '统计结果',
                    message: '未找到有效的要素进行分析',
                    position: 'bottom-right',
                    duration: 0,
                    type: 'error',
                    offset: 50
                });
                loading.close();
                return;
            }

            // 使用空间索引加速查询
            const rtree = new RBush();
            relevantFeatures.forEach(feature => {
                const bbox = turf.bbox(feature);
                rtree.insert({ ...feature, minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3] });
            });

            // 计算缓冲区内的点或线元素
            const results = await Promise.all(bufferFeatures.map(async bufferFeature => await this.calculateStatistics(bufferFeature, rtree, this.bufferCenters, this.bufferDistance)));

            // 显示统计结果
            this.showStatistics(results);

            // 获取缓冲区内的所有要素
            const allFilteredFeatures: turf.Feature[] = [];
            this.bufferLayerIds.forEach(layerId => {
                const bufferCenter = this.bufferCenters[layerId];
                if (bufferCenter) {
                    const bufferCenterPoint = turf.point(bufferCenter);
                    const filteredFeatures = this.filterRelevantFeatures(rtree, bufferCenterPoint, this.bufferDistance);
                    console.log("filteredFeatures",filteredFeatures)
                    allFilteredFeatures.push(...filteredFeatures);
                }
            });

            // 创建新图层并加载到地图上
            const newLayerId = "buffer_elements_" + String(new Date().getTime());
            this.createLayerFromFeatures(allFilteredFeatures, newLayerId);
        } finally {
            // 关闭等待动画
            loading.close();
        }
    }

    /**
     * @description: 获取所有带“WS”或“YS”的图层
     * @param {mapboxgl.Map} map
     * @return {mapboxgl.Layer[]}
     */
    getRelevantLayers(map: mapboxgl.Map) {
        return map.getStyle().layers.filter(layer => layer.id.includes('WS') || layer.id.includes('YS'));
    }

    /**
     * @description: 获取所有缓冲区图层
     * @param {string[]} bufferLayerIds
     * @param {mapboxgl.Map} map
     * @return {mapboxgl.Layer[]}
     */
    getBufferLayers(bufferLayerIds: string[], map: mapboxgl.Map) {
        return bufferLayerIds.filter(layerId => map.getLayer(layerId));
    }

    /**
     * @description: 获取相关图层的数据
     * @param {mapboxgl.Layer} layer
     * @return {Promise<turf.Feature[]>}
     */
    async getRelevantFeatures(layer: mapboxgl.Layer) {
        const source = this.map.getSource(layer.source) as mapboxgl.GeoJSONSource;
        if (source) {
            if (source['_data'] && typeof source['_data'] === 'string') {
                // 静态文件路径从服务器获取数据
                try {
                    const response = await axios.get(source['_data']);
                    return response.data.features;
                } catch (error) {
                    console.error('Failed to fetch data from:', source['_data'], error);
                    return [];
                }
            } else if (source._data) {
                return source._data.features;
            }
        }
        return [];
    }

    /**
     * @description: 获取所有缓冲区图层的数据
     * @param {mapboxgl.Layer[]} bufferLayers
     * @return {turf.Feature[]}
     */
    getBufferFeatures(bufferLayers) {
        const bufferFeatures: turf.Feature[] = [];
        for (const layerId of bufferLayers) {
            if (!layerId.endsWith("outline")) {
                const source = this.map.getSource(layerId) as mapboxgl.GeoJSONSource;
                console.log("Buffer Source:", source);
                if (source && source._data) {
                    const feature: turf.Feature = {
                        id: source.id,
                        type: 'Feature',
                        geometry: source._data.geometry,
                        properties: source._data.properties
                    };
                    bufferFeatures.push(feature);
                }
            }
        }
        return bufferFeatures;
    }

    /**
     * @description: 筛选出缓冲区中心{bufferDistance}米半径内的相关要素
     * @param {RBush} rtree 空间索引
     * @param {turf.Point} bufferCenterPoint
     * @return {turf.Feature[]}
     */
    filterRelevantFeatures(rtree: RBush, bufferCenterPoint: turf.Point, bufferDistance: number) {
        const bufferBbox = turf.bbox(turf.buffer(bufferCenterPoint, bufferDistance, { units: 'meters' }));
        const [minX, minY, maxX, maxY] = bufferBbox;
        const candidates = rtree.search({ minX, minY, maxX, maxY });

        return candidates.filter(feature => {
            let featureCenter: turf.Point;
            if (feature.geometry.type === 'Point') {
                featureCenter = point(feature.geometry.coordinates);
            } else if (feature.geometry.type === "MultiLineString") {
                featureCenter = centroid(feature);
            } else {
                console.error('Unsupported geometry type:', feature.geometry.type);
                return false;
            }
            return distance(bufferCenterPoint, featureCenter, { units: 'meters' }) <= bufferDistance;
        });
    }

    /**
     * @description: 将 MultiLineString 转换为 LineString
     * @param {turf.Feature[]} relevantFeatures
     * @return {turf.Feature[]}
     */
    processRelevantFeatures(relevantFeatures: turf.Feature[]) {
        return relevantFeatures.flatMap(feature => {
            if (feature.geometry.type === 'MultiLineString') {
                return this.multiLineStringToLineStrings(feature.geometry, feature.properties);
            }
            return feature;
        });
    }

    /**
     * @description: 分离 Point 和 LineString
     * @param {turf.Feature[]} processedRelevantFeatures
     * @return {{ pointFeatures: turf.Feature[], lineFeatures: turf.Feature[] }}
     */
    separatePointsAndLines(processedRelevantFeatures: turf.Feature[]) {
        const pointFeatures = processedRelevantFeatures.filter(feature => feature.geometry.type === 'Point');
        const lineFeatures = processedRelevantFeatures.filter(feature => feature.geometry.type === "LineString");
        return { pointFeatures, lineFeatures };
    }

    /**
     * @description: 去重处理点
     * @param {turf.Feature[]} pointFeatures
     * @return {{ wsPointFeatures: turf.Feature[], ysPointFeatures: turf.Feature[] }}
     */
    removeDuplicatePoints(pointFeatures: turf.Feature[]) {
        const uniquePointIds = new Set<string>();
        const wsPointFeatures = pointFeatures.filter(feature => {
            const pointId = feature.properties.ObjectID;
            if (feature.properties.FEATUREID.includes('WS') && !uniquePointIds.has(pointId)) {
                uniquePointIds.add(pointId);
                return true;
            }
            return false;
        });

        const ysPointFeatures = pointFeatures.filter(feature => {
            const pointId = feature.properties.ObjectID;
            if (feature.properties.FEATUREID.includes('YS') && !uniquePointIds.has(pointId)) {
                uniquePointIds.add(pointId);
                return true;
            }
            return false;
        });

        return { wsPointFeatures, ysPointFeatures };
    }

    /**
         * @description: 去重处理线
         * @param {turf.Feature[]} lineFeatures
         * @return {{ wsLineFeatures: turf.Feature[], ysLineFeatures: turf.Feature[] }}
         */
    removeDuplicateLines(lineFeatures: turf.Feature[]) {
        const uniqueLineIds = new Set<string>();
        const uniqueLineWithinFeatures = lineFeatures.filter(lineFeature => {
            const lineFeatureId = lineFeature.properties.ObjectID;
            if (!uniqueLineIds.has(lineFeatureId)) {
                uniqueLineIds.add(lineFeatureId);
                return true;
            }
            return false;
        });

        const wsLineFeatures = uniqueLineWithinFeatures.filter(lineFeature => lineFeature.properties?.FEATUREID?.includes('WS'));
        const ysLineFeatures = uniqueLineWithinFeatures.filter(lineFeature => lineFeature.properties?.FEATUREID?.includes('YS'));

        return { wsLineFeatures, ysLineFeatures };
    }

    /**
     * @description: 计算统计结果
     * @param {turf.Feature} bufferFeature
     * @param {RBush} rtree 空间索引
     * @param {Record<string, [number, number]>} bufferCenters
     * @param {number} bufferDistance 缓冲区距离（米）
     * @return {Promise<{ wsPointCount: number, ysPointCount: number, wsLineCount: number, ysLineCount: number, wsLineLength: string, ysLineLength: string }>}
     */
    async calculateStatistics(bufferFeature: turf.Feature, rtree: RBush, bufferCenters: Record<string, [number, number]>, bufferDistance: number) {
        const bufferCenter = bufferCenters[bufferFeature.id];
        if (!bufferCenter) {
            console.error('No buffer center found for buffer feature:', bufferFeature.id);
            return {
                wsPointCount: 0,
                ysPointCount: 0,
                wsLineCount: 0,
                ysLineCount: 0,
                wsLineLength: '0.00',
                ysLineLength: '0.00'
            };
        }

        const bufferCenterPoint = turf.point(bufferCenter);

        // 筛选出缓冲区中心 (bufferDistance + 50) 米半径内的相关要素
        const filteredRelevantFeatures = this.filterRelevantFeatures(rtree, bufferCenterPoint, bufferDistance);

        // 将 MultiLineString 转换为 LineString
        const processedRelevantFeatures = this.processRelevantFeatures(filteredRelevantFeatures);

        // 分离 Point 和 LineString
        const { pointFeatures, lineFeatures } = this.separatePointsAndLines(processedRelevantFeatures);

        // 点的去重处理
        const { wsPointFeatures, ysPointFeatures } = this.removeDuplicatePoints(pointFeatures);

        // 点的求交处理
        const pointWithinFeatures = turfWithin(turf.featureCollection(wsPointFeatures.concat(ysPointFeatures)), turf.featureCollection([bufferFeature]));
        const wsPointWithinFeatures = pointWithinFeatures.features.filter(feature => feature.properties?.FEATUREID?.includes('WS'));
        const ysPointWithinFeatures = pointWithinFeatures.features.filter(feature => feature.properties?.FEATUREID?.includes('YS'));

        const wsPointCountWithin = wsPointWithinFeatures.length;
        const ysPointCountWithin = ysPointWithinFeatures.length;

        // 线的去重处理
        const { wsLineFeatures, ysLineFeatures } = this.removeDuplicateLines(lineFeatures);

        // 线的求交处理
        const wsLineWithinFeatures = wsLineFeatures.filter(wsLineFeature => turf.booleanIntersects(wsLineFeature, bufferFeature));
        const ysLineWithinFeatures = ysLineFeatures.filter(ysLineFeature => turf.booleanIntersects(ysLineFeature, bufferFeature));

        const wsLineCountWithin = wsLineWithinFeatures.length;
        const ysLineCountWithin = ysLineWithinFeatures.length;

        const wsLineLength = wsLineWithinFeatures.reduce((totalLength, lineFeature) => {
            const shapeLengthStr = lineFeature.properties.Shape_Leng;
            if (shapeLengthStr) {
                const shapeLength = parseFloat(shapeLengthStr.replace(' m', ''));
                return totalLength + shapeLength;
            }
            return totalLength;
        }, 0).toFixed(2);

        const ysLineLength = ysLineWithinFeatures.reduce((totalLength, lineFeature) => {
            const shapeLengthStr = lineFeature.properties.Shape_Leng;
            if (shapeLengthStr) {
                const shapeLength = parseFloat(shapeLengthStr.replace(' m', ''));
                return totalLength + shapeLength;
            }
            return totalLength;
        }, 0).toFixed(2);

        console.log("WS Point Count: ", wsPointCountWithin, "WS Line Count: ", wsLineCountWithin, "WS Line Length: ", wsLineLength);
        console.log("YS Point Count: ", ysPointCountWithin, "YS Line Count: ", ysLineCountWithin, "YS Line Length: ", ysLineLength);
        return {
            wsPointCount: wsPointCountWithin,
            ysPointCount: ysPointCountWithin,
            wsLineCount: wsLineCountWithin,
            ysLineCount: ysLineCountWithin,
            wsLineLength,
            ysLineLength
        };
    }

    /**
     * @description: 显示统计结果
     * @param {Array<{ wsPointCount: number, ysPointCount: number, wsLineCount: number, ysLineCount: number, wsLineLength: string, ysLineLength: string }>} results
     */
    showStatistics(results: Array<{ wsPointCount: number, ysPointCount: number, wsLineCount: number, ysLineCount: number, wsLineLength: string, ysLineLength: string }>) {
        this.statisticsNotification = ElNotification({
            title: '统计结果',
            message: results.map(result => `污水井盖统计: ${result.wsPointCount}<br>雨水井盖统计: ${result.ysPointCount}<br>污水管线统计: ${result.wsLineCount}<br>雨水管线统计: ${result.ysLineCount}<br>污水管线长度: ${result.wsLineLength} meters<br>雨水管线长度: ${result.ysLineLength} meters`).join('<br><br>'),
            position: 'bottom-right',
            duration: 0,
            dangerouslyUseHTMLString: true
        });
    }

/**
 * @description: 用缓冲区内的要素创建新图层并加载到地图上
 * @param {turf.Feature[]} features 缓冲区内的要素
 * @param {string} layerId 新图层的ID
 * @return {void}
 */
createLayerFromFeatures(features: turf.Feature[], layerId: string) {
    const featuresCollection = turf.featureCollection(features);

    // 分离点和线要素
    const { pointFeatures, lineFeatures } = this.separatePointsAndLines(this.processRelevantFeatures(featuresCollection.features));

    // 创建点要素图层
    if (pointFeatures.length > 0) {
        const pointLayerId = `${layerId}_points`;
        if (this.map.getLayer(pointLayerId)) {
            this.map.removeLayer(pointLayerId);
        }
        this.map.addLayer({
            id: pointLayerId,
            type: 'circle',
            source: {
                type: 'geojson',
                data: turf.featureCollection(pointFeatures)
            },
            paint: {
                'circle-radius': 5, // 点要素的半径
                'circle-color': '#FF0000', // 点要素的颜色
            }
        });

        // 存储点要素图层的ID
        this.bufferLayerIds.push(pointLayerId);
    }

    // 创建线要素图层
    if (lineFeatures.length > 0) {
        const lineLayerId = `${layerId}_lines`;
        if (this.map.getLayer(lineLayerId)) {
            this.map.removeLayer(lineLayerId);
        }
        this.map.addLayer({
            id: lineLayerId,
            type: 'line',
            source: {
                type: 'geojson',
                data: turf.featureCollection(lineFeatures)
            },
            paint: {
                'line-color': '#f5a627', // 线要素的颜色
                'line-width': 2 // 线要素的宽度
            }
        });

        // 存储线要素图层的ID
        this.bufferLayerIds.push(lineLayerId);
    }
}



}