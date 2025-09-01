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
import { initMap, removeAllLayers } from "@/utils/map";
import mapboxgl from "mapbox-gl";
import { baseStore } from "@/stores";
import BufferRangeSelector from "@/components/BufferRangeSelector.vue";

const props = defineProps(["toolbar"]);
const { toolbar } = toRefs(props);
const bStore = baseStore();

let options = reactive([
  { id: 1, name: '图层管理', icon: layerManage },
  { id: 2, name: '信息查询', icon: infoInquiry },
  { id: 3, name: '数据统计', icon: dataStatistics },
]);

let currentSelect = ref(0);
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
  bMap.on('load', () => {
    bStore.setMapValue(bMap);
    bMap.on('click', onMapClick);
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
