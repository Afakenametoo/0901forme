<!--
 * @Author: Sleip
 * @Date: 2025-02-05 11:20:07
 * @LastEditors: lily 784710791@qq.com
 * @LastEditTime: 2025-02-18 16:22:14
 * @FilePath: \underground_pipelines_display\src\components\Popup.vue
 * @Description: 
 * 
 * Copyright (c) 2025 by Sleip, All Rights Reserved. 
-->
<template>
  <div class="popup" v-show="infos && infos.length > 0" ref="popupDiv">
    <div class="popup-content" v-if="activeInfo">
      <div
          class="info-item"
          v-for="(value, key) in activeInfo.mapping"
          :key="key"
      >
        <span class="info-label" v-if="value !== false">{{ value }}：</span>
        <span class="info-value" :title="activeInfo.properties[key]">
<!--          {{ (activeInfo.name.includes("POINT") && (key === "井盖材质")) ?   activeInfo.properties[key] || "未提供" }}-->
          {{ activeInfo.properties[key] || "未提供" }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import mapboxgl from "mapbox-gl/dist/mapbox-gl.js";
import {baseStore} from "@/stores";
const bStore = baseStore()

//data
let infos = ref([]);
const activeInfoName = ref("");
const activeInfo = ref();
//模板变量
const popupDiv = ref();
const popup = new mapboxgl.Popup();
const popupInfo = computed(() => {
  return bStore.popupInfo
});

watch(popupInfo, () => {
  infos.value = popupInfo.value.infos || [];
  if (infos.value && infos.value.length > 0) {
    //获取值
    activeInfo.value = infos.value[0];
    if (infos.value[0].name) activeInfoName.value = infos.value[0].name;
    popup.setDOMContent(popupDiv.value).setLngLat(popupInfo.value.lnglat).addTo(toRaw(bStore.boxMap));
  } else {
    popup.remove();
  }
})

</script>
<style scoped>
@import '@/styles/components/popup.scss';
</style>


<style>
.mapboxgl-popup-content {
  background-color: #FFFFFF;

  .mapboxgl-popup-close-button {
    outline: none !important;
  }
}

.mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
  border-top-color: #FFFFFF;
  border-bottom-color: #FFFFFF;
}

.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
  border-bottom-color: #FFFFFF;
  border-top-color: #FFFFFF;
}
</style>