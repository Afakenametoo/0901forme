<template>
  <div class="layer-container">
    <div class="title">
      图层管理
    </div>
    <div class="box">
      <div class="left-box">
        <el-button v-for="(item) in layer.layerList" :key="item.id" class="left-box-button" @click="layer.clickLayer(item.id)">
          {{ item.name }}
        </el-button>
      </div>
      <div class="right-box">
        <el-input placeholder="请输入关键字进行过滤" v-model="layer.filterText" class="filter-input"></el-input>
        <el-tree class="filter-tree"
          :default-checked-keys="store.currentLayerId === 1 ? store.baseLayer : store.currentLayerId === 2 ? store.specialLayer : []"
          :data="store.currentLayerId === 1 ? baseLayer : store.currentLayerId === 2 ? specialLayer : []" show-checkbox
          node-key="id" default-expand-all :filter-node-method="layer.filterNode" ref="tree" :highlight-current="true"
          empty-text="暂无数据" @check-change="layer.checkFun" @check="layer.checkControl">
          <template #default="{ data }">
            <span>{{ data.label }}</span>
            <!-- 注记开关 -->
            <!-- <el-switch v-if="!data.children && data.type === 'symbol'" v-model="data.showLabel"
              @change="setLayerVisible(data.showLabel, data.name, 'label')">
              <template #active-action>
                <span class="custom-active-action">注</span>
              </template>
              <template #inactive-action>
                <span class="custom-inactive-action">注</span>
              </template>
            </el-switch> -->
            <!-- 流向开关 -->
            <el-switch v-if="!data.children && data.type === 'line'" v-model="data.showFlow"
              @change="setLayerVisible(data.showFlow, data.name, 'flow')">
              <template #active-action>
                <span class="custom-active-action">流</span>
              </template>
              <template #inactive-action>
                <span class="custom-inactive-action">流</span>
              </template>
            </el-switch>
          </template>
        </el-tree>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { baseStore, layerStore } from "@/stores";
import { baseLayer, specialLayer, baseLabel } from "@/data/layerConfig";
import { ElTree } from 'element-plus';
import { callRemoveBoxSelect } from '@/stores/globalBoxSelect';
import { setLyrVisible } from "@/utils/map"; // 确保路径正确

import {
  addClusterPointLayer, addGeoJsonLayer,
  addRasterWMTSLayer,
  moveLayer,
  removeLayerById, removeListen, setClusterListen, moveLayerAll,
  setCtxtListen,
  setLayerCursor,
  setWifiLayerVisible,
} from "@/utils/map";
import { Logger } from "sass";

const tree = ref<InstanceType<typeof ElTree> | null>(null);
const store = layerStore();
const bStore = baseStore();

const layer = reactive({
  filterText: '',
  currentLayerId: 0,
  layerList: [
    { id: 1, name: "底图图层" },
    { id: 2, name: "专题图层" }
  ],
  clickLayer: (id: number) => {
    store.setCurrentLayerId(id);
  },
  filterNode: (value, data) => {
    if (!value) return true;
    return data.label.indexOf(value) !== -1;
  },
  // 控制图层
  checkFun: (obj, flag) => {
    const layer = toRaw(obj);
    const map = toRaw(bStore.boxMap);
    if(!map) return;
    //处理矢量图层
    if (obj.type === 'image') {
      if (flag) {
        if (!map.getLayer(layer.name)) {
        addRasterWMTSLayer(map, layer); // 首次加载时创建图层
      } else {
        setLyrVisible(map, layer.name, true); // 已存在则显示
      }
      moveLayerAll(map);
      } else {
        // removeLayerById(map, layer.name);
        // map.setLayoutProperty(layer.name, 'visibility', 'none');
        setLyrVisible(map, layer.name, false);
      }
    } 
    else if (obj.type === 'line') {
      if (flag) {
        addGeoJsonLayer(toRaw(bStore.boxMap), layer);
        moveLayerAll(toRaw(bStore.boxMap));

        // 添加流向图层
        const flowVisibility = layer.showFlow ? 'visible' : 'none';
        let lineColor = '#f2fe60';
        if (layer.name.includes('WS')) {
          lineColor = '#ebebeb';
        }

        let flowLyr = {
          type: 'line',
          name: layer.name + '_dashed',
          source: layer.name,
          alias: '管线设置',
          layout: { visibility: flowVisibility },
          style: {
            'line-color': lineColor,
            'line-width': 4,
            'line-opacity': [
              "step",
              ["zoom"],
              0,
              16,
              1
            ]
          }
        };
        addGeoJsonLayer(toRaw(bStore.boxMap), flowLyr);
        bStore.addCheckedLayer([layer.name, flowLyr.name]);
      } else {
        removeLayerById(toRaw(bStore.boxMap), layer.name + '_dashed');
        removeLayerById(toRaw(bStore.boxMap), layer.name + '_label');
        removeLayerById(toRaw(bStore.boxMap), layer.name);
        callRemoveBoxSelect();
      }
    } else if (obj.type === 'symbol') {
      if (flag) {
        // 检查是否为WiFi图层，使用特殊处理
        if (layer.name === 'WIFI_POINT') {
          // WiFi图层使用特殊的显示控制，因为它已经在地图初始化时加载
          setWifiLayerVisible(toRaw(bStore.boxMap), true);
          bStore.addCheckedLayer(layer.name);
        } else {
          // 添加主图层（井盖等传统图层）
          addClusterPointLayer(toRaw(bStore.boxMap), layer);
          bStore.addCheckedLayer(layer.name);
          setClusterListen(toRaw(bStore.boxMap), layer.name);
          setLayerCursor(toRaw(bStore.boxMap), layer.name + "_cluster", true);

          // 添加注记图层
          const labelVisibility = layer.showLabel ? 'visible' : 'none';
          const labelLayer = {
            type: 'symbol',
            name: layer.name + '_label',
            source: layer.name,
            layout: {
              'text-field': ['get', 'name'], // 假设注记显示字段为 'name'
              'text-size': 12,
              'text-offset': [0, 1],
              'text-anchor': 'top',
              'visibility': labelVisibility,
            },
            paint: {
              'text-color': '#000000',
              'text-halo-color': '#ffffff',
              'text-halo-width': 1,
            },
          };
          addGeoJsonLayer(toRaw(bStore.boxMap), labelLayer);
          bStore.addCheckedLayer(labelLayer.name);
        }
      } else {
        // 检查是否为WiFi图层
        if (layer.name === 'WIFI_POINT') {
          // 隐藏WiFi图层
          setWifiLayerVisible(toRaw(bStore.boxMap), false);
        } else {
          // 移除传统图层
          removeLayerById(toRaw(bStore.boxMap), layer.name);
          removeLayerById(toRaw(bStore.boxMap), layer.name + "_cluster");
          removeLayerById(toRaw(bStore.boxMap), layer.name + "_cluster_count");
          removeLayerById(toRaw(bStore.boxMap), layer.name + "_label");
          removeListen(toRaw(bStore.boxMap), layer.name + "_cluster");
          setLayerCursor(toRaw(bStore.boxMap), layer.name + "_cluster", false);
          moveLayerAll(toRaw(bStore.boxMap));
        }
        callRemoveBoxSelect();
      }
    }
  },
  // 控制选中状态
  checkControl: (obj, arr) => {
    const addArr = arr?.checkedKeys;
    if (store.currentLayerId === 1) {
      store.setBaseLayer(addArr);
    } else {
      store.setSpecialLayer(addArr);
    }
  },
});

/**
 * @description: 控制图层显隐
 * @param {*} value
 * @param {*} dataName
 * @param {*} type
 * @return {*}
 */
const setLayerVisible = (value: boolean, dataName: string, type: string) => {
  const visibility = value ? "visible" : "none";
  const layerName = type === 'label' ? dataName + '_label' : dataName + '_dashed';

  // 特殊处理WiFi图层的注记
  if (dataName === 'WIFI_POINT' && type === 'label') {
    // WiFi图层的注记显示在wifi-points图层上
    if (toRaw(bStore.boxMap).getLayer('wifi-points')) {
      const currentLayout = toRaw(bStore.boxMap).getLayoutProperty('wifi-points', 'text-field');
      if (value) {
        // 显示注记：设置text-field为ssid
        toRaw(bStore.boxMap).setLayoutProperty('wifi-points', 'text-field', ['get', 'ssid']);
      } else {
        // 隐藏注记：清空text-field
        toRaw(bStore.boxMap).setLayoutProperty('wifi-points', 'text-field', '');
      }
    }
  } else if (toRaw(bStore.boxMap).getLayer(layerName)) {
    toRaw(bStore.boxMap).setLayoutProperty(layerName, "visibility", visibility);
  }

  if (type === 'flow') {
    if (dataName.includes('YS')) {
      if (value) animateDashArray(0);
      else {
        cancelAnimationFrame(animationId);
        animationId = -1;
      }
    } else if (dataName.includes('WS')) {
      if (value) animateDashArray2(0);
      else {
        cancelAnimationFrame(animationId2);
        animationId2 = -1;
      }
    }
  }
};

/**
 * @description: 流向动画参数
 * @return {*}
 */
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

watch(
  () => layer.filterText,
  (val) => {
    if (tree.value) {
      tree.value.filter(val); // 调用 ElTree 的 filter 方法
    }
  }
);

onMounted(async () => {
  setCtxtListen(toRaw(bStore.boxMap), 'geojson')
})
</script>
<style scoped>
@import "@/styles/components/layer.scss";
</style>
