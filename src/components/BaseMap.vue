<!--
 * @Author: 
 * @Date: 2024-12-11 09:17:11
 * @LastEditors: Sleip
 * @LastEditTime: 2025-02-19 16:29:38
 * @FilePath: \underground_pipelines_display\src\components\BaseMap.vue
 * @Description: 
 * Copyright (c) 2024 by Sleip, All Rights Reserved. 
-->
<!--基础地图组件-->
<template>
  <div class="container">
    <!-- 地图 -->
    <div class="baseMap" id="baseMap"></div>

    <img src="../assets/TL.png" alt="TL" class="TL">
    <!-- 工具栏 -->
    <div class="tools">
      <div class="item" v-for="(item) in options" :key="item.id" @click="clickTool(item.id)"
        :class="{ selected: item.id === currentSelect }" :style="{ backgroundImage: 'url(' + item.icon + ')' }">
        {{ item.name }}
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import layerManage from "@/assets/tcgl.svg";
import infoInquiry from "@/assets/xxcx.svg";
import dataStatistics from "@/assets/sjtj.svg";
import { initMap, removeAllLayers, initWifiLayer, loadWifiData, setWifiClickListener } from "@/utils/map";
import mapboxgl from "mapbox-gl";
import { baseStore, statisticsStore } from "@/stores";
import BufferRangeSelector from "@/components/BufferRangeSelector.vue";
import { fetchWifiPoints } from "@/data/wifiData";

const props = defineProps(["toolbar"]);
const { toolbar } = toRefs(props);
const bStore = baseStore();
const sStore = statisticsStore();

let options = reactive([
  { id: 1, name: '图层管理', icon: layerManage },
  { id: 2, name: '信息查询', icon: infoInquiry },
  { id: 3, name: '数据统计', icon: dataStatistics },
]);

let currentSelect = ref(1); // 默认选中图层管理，这样用户可以看到WiFi图层控制
let isBufferActive = ref(false);
let bMap: any = null;
let selectedPoint: any = null;

const clickTool = (id: number) => {
  if (currentSelect.value === id) {
    currentSelect.value = 0;
  } else {
    currentSelect.value = id;
  }
  if (id === 1) {
    toolbar.value.layerState = !toolbar.value.layerState;
    toolbar.value.infoState = false;
    toolbar.value.dataState = false;
  } else if (id === 2) {
    toolbar.value.infoState = !toolbar.value.infoState;
    toolbar.value.layerState = false;
    toolbar.value.dataState = false;
  } else if (id === 3) {
    toolbar.value.dataState = !toolbar.value.dataState;
    toolbar.value.layerState = false;
    toolbar.value.infoState = false;
  }
};

const onRangeChanged = (newRange: number) => {
  console.log('缓冲区范围改变:', newRange);
  // 在这里处理缓冲区范围的变化，比如更新地图上的缓冲区
};

const onCalculateBuffer = (range: number) => {
  console.log('计算缓冲区范围:', range);
  // 在这里处理计算缓冲区的逻辑，比如在地图上显示缓冲区
  if (selectedPoint) {
    // 假设你有一个方法来计算缓冲区并显示在地图上
    // calculateBufferOnMap(selectedPoint, range);
  }
};

const onMapClick = (event: mapboxgl.MapMouseEvent) => {
  if (currentSelect.value === 1) {
    isBufferActive.value = true;
    selectedPoint = event.lngLat;
    console.log('点选位置:', selectedPoint);
    // 可以在这里添加一个标记点
    // addMarkerToMap(bMap, selectedPoint);
  }
};

onMounted(async () => {
  bMap = initMap();
  /* bMap.on('load', async () => {
    bStore.setMapValue(bMap);
    bMap.on('click', onMapClick);
    
    // 初始化WiFi图层
    initWifiLayer(bMap);
    
    // 加载WiFi数据
    try {
      // 获取当前地图范围作为WiFi数据生成区域
      const bounds = bMap.getBounds();
      const wifiData = await fetchWifiPoints(2000, [
        bounds.getWest(),
        bounds.getSouth(), 
        bounds.getEast(),
        bounds.getNorth()
      ]);
      debugger
      // 加载WiFi数据到地图
      loadWifiData(bMap, wifiData);
      
      // 设置WiFi点击监听
      setWifiClickListener(bMap);
      
      // 更新WiFi点数统计
      sStore.setWifiPointCount(wifiData.length);
      
      console.log('WiFi数据加载完成:', wifiData.length, '个点');
      console.log('WiFi数据样例:', wifiData.slice(0, 3));
      
      // 强制显示WiFi图层
      setTimeout(() => {
        const map = bStore.boxMap;
        if (map.getLayer('wifi-points')) {
          map.setLayoutProperty('wifi-points', 'visibility', 'visible');
          console.log('wifi-points图层已设置为可见');
        }
        if (map.getLayer('wifi-clusters')) {
          map.setLayoutProperty('wifi-clusters', 'visibility', 'visible');
          console.log('wifi-clusters图层已设置为可见');
        }
        if (map.getLayer('wifi-cluster-count')) {
          map.setLayoutProperty('wifi-cluster-count', 'visibility', 'visible');
          console.log('wifi-cluster-count图层已设置为可见');
        }
        
        // 强制重新渲染地图
        map.triggerRepaint();
        
        // 输出图层顺序调试信息
        const layers = map.getStyle().layers;
        console.log('当前图层列表:', layers.map(l => l.id));
        
        // 添加一个测试点到地图中心
        const center = map.getCenter();
        const testWifiData = {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [center.lng, center.lat]
            },
            properties: {
              id: 'test-wifi',
              ssid: '测试WiFi',
              signalQuality: 100,
              operator: '测试'
            }
          }]
        };
        
        // 更新WiFi数据源，包含测试点
        if (map.getSource('wifi-source')) {
          const currentData = map.getSource('wifi-source')._data;
          currentData.features.push(testWifiData.features[0]);
          map.getSource('wifi-source').setData(currentData);
          console.log('已添加测试WiFi点到地图中心:', center);
        }
        
        console.log('WiFi图层强制显示完成');
      }, 1000);
      
      // 默认开启图层管理面板，让用户能看到WiFi图层控制
      toolbar.value.layerState = true;
    } catch (error) {
      console.error('WiFi数据加载失败:', error);
    }
  }); */
   const map = bMap;
   map.on('load', () => {
        // Add a new source from our GeoJSON data and
        // set the 'cluster' option to true. GL-JS will
        // add the point_count property to your source data.
        map.addSource('earthquakes', {
            type: 'geojson',
            // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
            // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
            data: '/files/geojson/wifi.geojson',
            cluster: true,
            clusterMaxZoom: 14, // Max zoom to cluster points on
            clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });

        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'earthquakes',
            filter: ['has', 'point_count'],
            paint: {
                // Use step expressions (https://docs.mapbox.com/style-spec/reference/expressions/#step)
                // with three steps to implement three types of circles:
                //   * Blue, 20px circles when point count is less than 100
                //   * Yellow, 30px circles when point count is between 100 and 750
                //   * Pink, 40px circles when point count is greater than or equal to 750
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6',
                    100,
                    '#f1f075',
                    750,
                    '#f28cb1'
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    100,
                    30,
                    750,
                    40
                ]
            }
        });

        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'earthquakes',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': ['get', 'point_count_abbreviated'],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }
        });

        map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'earthquakes',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': '#11b4da',
                'circle-radius': 4,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });

        // inspect a cluster on click
        map.on('click', 'clusters', (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['clusters']
            });
            const clusterId = features[0].properties.cluster_id;
            map.getSource('earthquakes').getClusterExpansionZoom(
                clusterId,
                (err, zoom) => {
                    if (err) return;

                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                }
            );
        });

        // When a click event occurs on a feature in
        // the unclustered-point layer, open a popup at
        // the location of the feature, with
        // description HTML from its properties.
        map.on('click', 'unclustered-point', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const mag = e.features[0].properties.mag;
            const tsunami =
                e.features[0].properties.tsunami === 1 ? 'yes' : 'no';

            // Ensure that if the map is zoomed out such that
            // multiple copies of the feature are visible, the
            // popup appears over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(
                    `magnitude: ${mag}<br>Was there a tsunami?: ${tsunami}`
                )
                .addTo(map);
        });

        map.on('mouseenter', 'clusters', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', () => {
            map.getCanvas().style.cursor = '';
        });
    });


});

onUnmounted(() => {
  removeAllLayers(bMap);
  mapboxgl.clearStorage();
  bMap.off('click', onMapClick);
});
</script>

<style scoped>
@import "@/styles/components/map-view.scss";
</style>
