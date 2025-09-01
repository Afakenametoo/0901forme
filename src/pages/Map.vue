<!--
 * @Author: Sleip
 * @Date: 2024-12-12 13:59:17
 * @LastEditors: lily 784710791@qq.com
 * @LastEditTime: 2025-02-18 16:41:47
 * @FilePath: \underground_pipelines_display\src\pages\Map.vue
 * @Description: 
 * 
 * Copyright (c) 2025 by Sleip, All Rights Reserved. 
-->

<template>
  <base-map :toolbar></base-map>
  <!--    图层管理-->
  <layer v-if="toolbar.layerState"></layer>
  <!--    信息查询-->
  <query v-if="toolbar.infoState"></query>
  <!--    数据统计-->
  <statistics v-if="toolbar.dataState"></statistics>
  <display v-if="qStore.temp"></display>
  <popup></popup>
  <message></message>
  <ToolBar></ToolBar>
</template>

<script setup lang="ts">
import layer from '@/components/Layer.vue'
//import query from '@/components/QueryComponents/QueryContianer.vue'
import query from '@/components/Query.vue'
import statistics from '@/components/Statistics.vue'
import display from '@/components/Display.vue'
import {queryStore} from "@/stores";
import BaseMap from "@/components/BaseMap.vue";
import Popup from "@/components/Popup.vue";
import Message from "@/components/Message.vue";
import ToolBar from '@/components/ToolBar.vue';

const qStore = queryStore()

// 工具栏
let toolbar = reactive({
  // 控制选中状态
  currentSelect: 0,
  layerState: false,
  infoState: false,
  dataState: false,
})


</script>

<style scoped>
@import '@/styles/pages/map.scss';
</style>
