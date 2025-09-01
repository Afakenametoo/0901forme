<template>
  <div class="right-t-box">
    <div v-for="(options, queryType) in queryOptions" :key="queryType" class="right-t-box-select">
      <span class="label-text">按{{ queryType }}查询:</span>
      <el-select filterable clearable placeholder="请输入查询区域" v-model="selectedOptions[queryType]" @clear="clearStreetSelection" class="select-input">
        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
      </el-select>
    </div>
    <div class="right-t-box-but">
      <el-button type="primary" plain @click="submitQuery" class="query-btn">查询</el-button>
      <el-button type="warning" plain @click="clearStreetSelection" class="clear-btn-2">清除</el-button>
    </div>
    <el-divider><i class="el-icon-arrow-up"></i></el-divider>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { baseStore, layerStore, statisticsStore } from "@/stores";
import { parse } from 'terraformer-wkt-parser';
import { setLyrVisible, setLayerCursor, setLayerListen, removeListen, setCtxtListen, removeClickedFeas, setLayerVisible } from "@/utils/map";
import { pointColumns, lineColumns } from '@/data/QueryData';
import { baseLayer, specialLayer } from "@/data/layerConfig";
import * as turf from '@turf/turf';
import * as mapboxgl from 'mapbox-gl';

const store = layerStore();
const bStore = baseStore();
const sStore = statisticsStore();

const roadOptions = ref<{ label: string, value: string }[]>([]);
const narrowOptions = ref<{ label: string, value: string }[]>([]);
const otherOptions = ref<{ label: string, value: string }[]>([]);

const selectedStreet = ref<string | null>(null);
const selectedRoad = ref<string | null>(null);
const selectedNarrow = ref<string | null>(null);
const selectedOther = ref<string | null>(null);

const queryOptions = reactive({
  '道路': roadOptions,
  '弄巷': narrowOptions,
  '其他': otherOptions
});

const selectedOptions = reactive({
  '道路': null,
  '弄巷': null,
  '其他': null
});

const emit = defineEmits(['submit-query', 'clear-selection']);

const getSelectedLayers = () => {
  const specialLayer = store.getSpecialLayer();
  if (!specialLayer || specialLayer.length === 0) {
    ElMessage({
      message: '请加载专题图层！',
      type: 'warning',
      duration: 3000
    });
    return;
  }
  const layers: string[] = [];
  specialLayer.forEach((layerId) => {
    switch (layerId) {
      case 3:
        layers.push('雨水井盖');
        selectedLayers.push("YS_POINT");
        selectedLayers.push("YS_POINT_cluster");
        break;
      case 4:
        layers.push('污水井盖');
        selectedLayers.push("WS_POINT");
        selectedLayers.push("WS_POINT_cluster");
        break;
      case 5:
        layers.push('雨水管线');
        selectedLayers.push("YS_LINE");
        break;
      case 6:
        layers.push('污水管线');
        selectedLayers.push("WS_LINE");
        break;
    }
  });
  return layers;
};

const removeAnime = () => {
  specialLayer.forEach(element => {
    element.children.forEach((e: { label: string; showFlow: any; showLabel: any; }) => {
      if (e.label == '雨水管线') {
        setLayerVisible(false, "YS_LINE", "flow");
      }
      if (e.label == '污水管线') {
        setLayerVisible(false, "WS_LINE", "flow");
      }
      if (e.label == '雨水井盖') {
        setLayerVisible(false, "YS_POINT", "label");
      }
      if (e.label == '污水井盖') {
        setLayerVisible(false, "WS_POINT", "label");
      }
    });
  });
};

const submitQuery = async () => {
  const selectedStreets = Object.values(selectedOptions).filter(Boolean);
  if (selectedStreets.length === 0) {
    ElMessage({
      message: "请选择至少一个查询条件",
      type: "warning",
      duration: 3000,
    });
    return;
  }
  const queryParams = {
    type: getSelectedLayers(),
    street: selectedStreets,
  };
  removeAnime();

  try {
    const response = await axios.post('/underground/search/listInfoByTypeAndStreet', JSON.stringify(queryParams), {
      headers: { 'Content-Type': 'application/json' }
    });

    const queryResult = reactive({
      WS_POINT: [],
      YS_POINT: [],
      WS_LINE: [],
      YS_LINE: []
    });

    const processData = (dataKey, layerKey, sourceKey) => {
      if (response.data.data[dataKey]) {
        queryResult[layerKey] = response.data.data[dataKey];
        setLyrVisible(bStore.boxMap, `${layerKey}_cluster`, false);
        setLyrVisible(bStore.boxMap, `${layerKey}_cluster_count`, false);
        setLyrVisible(bStore.boxMap, layerKey, false);

        const geojsonFeatures = response.data.data[dataKey].map(item => {
          if (layerKey.includes("POINT")) {
            sStore.incrementPointCount(dataKey.slice(0, 2));
          }
          if (layerKey.includes("LINE")) {
            addLineLengthToStats(dataKey.slice(0, 2), String(item.shapeLeng));
          }
          const geojson = parse(item.geom);
          return { type: 'Feature', geometry: geojson, properties: item.sswz };
        });

        if (geojsonFeatures.length > 0) {
          bStore.boxMap.getSource(sourceKey).setData({
            type: 'FeatureCollection',
            features: geojsonFeatures
          });
        }
      }
    };

    processData('WSJG', 'WS_POINT', 'tempPointLayer');
    processData('YSJG', 'YS_POINT', 'tempPointLayer');
    processData('WSGX', 'WS_LINE', 'tempLineLayer');
    processData('YSGX', 'YS_LINE', 'tempLineLayer');

    setLyrVisible(bStore.boxMap, "tempPointLayer", true);
    setLyrVisible(bStore.boxMap, "tempLineLayer", true);

    let bounds = geojsonFeatures.reduce((acc, geojson) => {
      try {
        const geoBounds = turf.bbox(geojson);
        if (Array.isArray(geoBounds) && geoBounds.length === 4 && geoBounds.every(val => !isNaN(val))) {
          if (!acc) return geoBounds;
          return [
            Math.min(acc[0], geoBounds[0]),
            Math.min(acc[1], geoBounds[1]),
            Math.max(acc[2], geoBounds[2]),
            Math.max(acc[3], geoBounds[3])
          ];
        }
      } catch (e) {
        console.error('边界框计算出错:', e);
      }
      return acc;
    }, null);

    if (bounds && bounds.every(val => !isNaN(val))) {
      bStore.boxMap.fitBounds(bounds, { padding: 50, maxZoom: 16 });
    }

    ElMessage({ message: '查询成功', type: 'success', duration: 3000 });
  } catch (error) {
    console.error('查询失败:', error);
    ElMessage({ message: '查询失败，请稍后重试。', type: 'error', duration: 3000 });
  }

  emit('submit-query', queryResult);
};

const clearStreetSelection = () => {
  selectedStreet.value = null;
  selectedRoad.value = null;
  selectedNarrow.value = null;
  selectedOther.value = null;

  setLyrVisible(bStore.boxMap, "tempPointLayer", false);
  setLyrVisible(bStore.boxMap, "tempLineLayer", false);

  const layerTypes = ["YS_POINT", "WS_POINT", "YS_LINE", "WS_LINE"];
  layerTypes.forEach(type => {
    if (queryResult[type] && queryResult[type].length > 0) {
      setLyrVisible(bStore.boxMap, `${type}_cluster`, true);
      setLyrVisible(bStore.boxMap, `${type}_cluster_count`, true);
      setLyrVisible(bStore.boxMap, type, true);
    }
  });

  queryResult.value = { WS_POINT: [], YS_POINT: [], WS_LINE: [], YS_LINE: [] };

  queryAllRoads();

  sStore.WS_POINT_COUNT = 25594;
  sStore.YS_POINT_COUNT = 9593;
  sStore.WS_LINE_LENGTH = 260.425;
  sStore.YS_LINE_LENGTH = 425.792;

  specialLayer.forEach(element => {
    element.children.forEach(e => {
      const { label, showFlow, showLabel } = e;
      if (label === '雨水管线') {
        setLayerVisible(showFlow, "YS_LINE", "flow");
      } else if (label === '污水管线') {
        setLayerVisible(showFlow, "WS_LINE", "flow");
      } else if (label === '雨水井盖') {
        setLayerVisible(showLabel, "YS_POINT", "label");
      } else if (label === '污水井盖') {
        setLayerVisible(showLabel, "WS_POINT", "label");
      }
    });
  });

  emit('clear-selection');
};

const queryAllRoads = () => {
  const queryParams = {
    type: getSelectedLayers(),
    flag: false
  };

  const requestData = JSON.stringify(queryParams);

  getAllStreet(requestData)
    .then((response) => {
      streetData.value = response.data.data.map((street: string) => ({
        value: street,
        label: street
      }));

      roadOptions.value = streetData.value.filter(item => /路$|道$|线$/.test(item.value));
      narrowOptions.value = streetData.value.filter(item => /弄$|巷$|街$/.test(item.value));
      otherOptions.value = streetData.value.filter(item => !/路$|道$|线$|弄$|巷$|街$/.test(item.value));
    })
    .catch((error) => {
      console.error('请求失败:', error);
    });
};

const addLineLengthToStats = (type: "WS" | "YS", lengthStr: string) => {
  const lengthInMeters = parseFloat(lengthStr.replace(/[^\d.]/g, "")) || 0;
  const lengthInKm = lengthInMeters / 1000;

  if (type === "WS") {
    sStore.WS_LINE_LENGTH += lengthInKm;
  } else if (type === "YS") {
    sStore.YS_LINE_LENGTH += lengthInKm;
  }
};

watch(selectedOptions, () => {
  if (Object.values(selectedOptions).every(option => !option)) {
    clearStreetSelection();
  }
}, { deep: true });

onMounted(() => {
  queryAllRoads();
});
</script>
