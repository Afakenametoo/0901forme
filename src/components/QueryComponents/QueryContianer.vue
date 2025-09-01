<template>
    <div class="query-container">
      <div class="title">信息查询</div>
      <div class="box">
        <QueryButtons @query-click="onQueryClick" />
        <QuerySpace v-if="activeQueryType === 1" @clear-selection="clearStreetSelection" />
        <QueryConditions v-if="activeQueryType === 2" @submit-query="submitQuery" @clear-selection="clearStreetSelection" />
        <QueryResultDialog v-model:visible="dialogVisible" :query-result="queryResult" @download-table="downloadTable" />
        <el-button type="primary" class="fixed-btn" @click="openDialog" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
          展示查询数据
        </el-button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted, onUnmounted } from 'vue';
  import { ElMessage } from 'element-plus';
  import QueryButtons from './QueryButtons.vue';
  import QuerySpace from './QuerySpace.vue';
  import QueryConditions from './QueryConditions.vue';
  import QueryResultDialog from './QueryResultDialog.vue';
  import { baseStore, layerStore, statisticsStore } from "@/stores";
  import { getAllStreet } from "@/services/query";
  import { setLyrVisible, setLayerCursor, setLayerListen, removeListen, setCtxtListen, removeClickedFeas, setLayerVisible } from "@/utils/map";
  import { pointColumns, lineColumns } from '@/data/queryData';
  import { baseLayer, specialLayer } from "@/data/layerConfig";
  import * as turf from '@turf/turf';
  import * as mapboxgl from 'mapbox-gl';
  import * as XLSX from 'xlsx';
  import { nextTick } from 'vue';
  
  const store = layerStore();
  const bStore = baseStore();
  const sStore = statisticsStore();
  
  const activeQueryType = ref<number>(1);
  const dialogVisible = ref(false);
  const queryResult = reactive({
    WS_POINT: [],
    YS_POINT: [],
    WS_LINE: [],
    YS_LINE: []
  });
  const currentPage = reactive({
    WS_POINT: 1,
    YS_POINT: 1,
    WS_LINE: 1,
    YS_LINE: 1,
  });
  const pageSize = 10;
  
  const onQueryClick = (id: number) => {
    activeQueryType.value = id;
  };
  
  const openDialog = () => {
    dialogVisible.value = true;
    nextTick(() => {
      console.log("Dialog should be visible now.", dialogVisible.value);
    });
  };
  
  const downloadTable = () => {
    const workbook = XLSX.utils.book_new();
    const dataGroups = {
      WS_POINT: queryResult.WS_POINT,
      YS_POINT: queryResult.YS_POINT,
      WS_LINE: queryResult.WS_LINE,
      YS_LINE: queryResult.YS_LINE,
    };
  
    Object.entries(dataGroups).forEach(([sheetName, data]) => {
      let columns = [];
      if (sheetName.includes('POINT')) {
        columns = pointColumns;
      } else if (sheetName.includes('LINE')) {
        columns = lineColumns;
      }
  
      if (data.length > 0) {
        const formattedData = data.map((item) =>
          columns.reduce((acc, col) => {
            if (item[col.prop] !== undefined) acc[col.label] = item[col.prop];
            return acc;
          }, {})
        );
  
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });
  
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '查询结果.xlsx';
    link.click();
  };
  
  const submitQuery = (result: any) => {
    queryResult.WS_POINT = result.WS_POINT;
    queryResult.YS_POINT = result.YS_POINT;
    queryResult.WS_LINE = result.WS_LINE;
    queryResult.YS_LINE = result.YS_LINE;
    dialogVisible.value = true;
  };
  
  const clearStreetSelection = () => {
    queryResult.WS_POINT = [];
    queryResult.YS_POINT = [];
    queryResult.WS_LINE = [];
    queryResult.YS_LINE = [];
    dialogVisible.value = false;
  };
  
  onMounted(() => {
    queryAllRoads();
    initTempLayer(
      bStore.boxMap,
      'tempPointLayer',
      'tempPointLayer',
      'circle',
      {
        'circle-radius': 5,
        'circle-color': '#f28cb1'
      }
    );
    initTempLayer(
      bStore.boxMap,
      'tempLineLayer',
      'tempLineLayer',
      'line',
      {
        'line-color': '#51bbd6',
        'line-width': 2
      }
    );
    getMatchedLayers();
  });
  
  onUnmounted(() => {
    findMatchingLayers(specialLayer, matchedLayers).forEach((item) => {
      removeListen(toRaw(bStore.boxMap), item.name);
      setLayerCursor(toRaw(bStore.boxMap), item.name, false);
    });
    isDisabled.value = true;
  
    setCtxtListen(toRaw(bStore.boxMap), 'geojson');
  });
  
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
  
  const getMatchedLayers = () => {
    const childrenArray = [3, 4, 5, 6];
    store.getSpecialLayer().forEach((item: any) => {
      if (childrenArray.includes(item)) {
        matchedLayers.push(item);
      }
    });
  };
  
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
  
  const initTempLayer = (map: any, sourceId: string, layerId: string, layerType: string, paint: any) => {
    if (map.getLayer(layerId)) {
      console.warn(`Layer '${layerId}' already exists. Removing old layer.`);
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      console.warn(`Source '${sourceId}' already exists. Removing old source.`);
      map.removeSource(sourceId);
    }
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    map.addLayer({
      id: layerId,
      type: layerType,
      source: sourceId,
      paint: paint
    });
  };
  
  const findMatchingLayers = (layerTree: any[], matchedIds: number[]): any[] => {
    const result: any[] = [];
    layerTree.forEach(layer => {
      if (matchedIds.includes(layer.id)) {
        result.push(layer);
      }
      if (layer.children) {
        result.push(...findMatchingLayers(layer.children, matchedIds));
      }
    });
    return result;
  };
  </script>
  
  <style scoped>
  @import '@/styles/components/query.scss';
  </style>
  