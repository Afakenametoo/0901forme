<template>
    <div class="right-s-box">
      <div class="right-box-title">
        <span>选择方式：</span>
      </div>
      <el-radio-group class="right-box-group" v-model="query.radio" type="vertical" @change="handleSelectionChange">
        <el-radio class="radio-btn" :value="1">点选</el-radio>
        <el-radio class="radio-btn" :value="2">框选</el-radio>
      </el-radio-group>
      <el-button style="display: flex; margin-left: 10px;" size="small" class="clear-btn-1" @click="clearStreetSelection" @keydown.space.prevent>
        清除框选
      </el-button>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted, onUnmounted } from 'vue';
  import { ElMessage } from 'element-plus';
  import { baseStore, layerStore, statisticsStore } from "@/stores";
  import { setLyrVisible, setLayerCursor, setLayerListen, removeListen, setCtxtListen, removeClickedFeas, setLayerVisible } from "@/utils/map";
  import { pointColumns, lineColumns } from '../data/queryData';
  import { baseLayer, specialLayer } from "@/data/layerConfig";
  import * as turf from '@turf/turf';
  import * as mapboxgl from 'mapbox-gl';
  import { nextTick } from 'vue';
  
  const store = layerStore();
  const bStore = baseStore();
  const sStore = statisticsStore();
  
  const query = reactive({
    radio: 0,
  });
  
  const isDisabled = ref(false);
  
  const emit = defineEmits(['clear-selection']);
  
  const handleSelectionChange = (value: number) => {
    if (value === 1) {
      activatePointSelect();
      isDisabled.value = true;
      emit('clear-selection');
  
    } else if (value === 2) {
      activateBoxSelect();
      isDisabled.value = false;
      removeClickedFeas(bStore.boxMap);
      clearAllHighlights(bStore.boxMap, matchedLayers);
      findMatchingLayers(specialLayer, matchedLayers).forEach(item => {
        setLayerCursor(toRaw(bStore.boxMap), item.name, false);
      });
  
    } else {
      findMatchingLayers(specialLayer, matchedLayers).forEach((item) => {
        setCtxtListen(toRaw(bStore.boxMap), 'geojson')
        removeListen(toRaw(bStore.boxMap), item.name);
      });
      isDisabled.value = true;
    }
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
  
  const getMatchedLayers = () => {
    const childrenArray = [3, 4, 5, 6];
    store.getSpecialLayer().forEach((item: any) => {
      if (childrenArray.includes(item)) {
        matchedLayers.push(item);
      }
    });
  }
  
  const activatePointSelect = () => {
    findMatchingLayers(specialLayer, matchedLayers).forEach(item => {
      setLayerListen(toRaw(bStore.boxMap), item.mapping, item)
      setLayerCursor(toRaw(bStore.boxMap), item.name, true)
    })
  
    queryResult.value = { WS_POINT: [], YS_POINT: [], WS_LINE: [], YS_LINE: [] };
  };
  
  const activateBoxSelect = () => {
    ElMessage({
      message: '按住空格开始点击框选，松开空格停止',
      type: 'warning',
      duration: 3000,
    });
  
    findMatchingLayers(specialLayer, matchedLayers).forEach((item) => {
      removeListen(toRaw(bStore.boxMap), item.name);
      setLayerCursor(toRaw(bStore.boxMap), item.name, false);
    });
  
    loadActivateBoxSelect(bStore.boxMap, selectedLayers, (selectedFeatures) => {
      if (!selectedFeatures || selectedFeatures.length === 0) return;
  
      queryResult.value = queryResult.value || { WS_POINT: [], YS_POINT: [], WS_LINE: [], YS_LINE: [] };
      Object.keys(queryResult.value).forEach(key => queryResult.value[key] = []);
      sStore.resetStatistics();
  
      initTempLayer(bStore.boxMap, 'tempPointLayer', 'tempPointLayer', 'circle', { 'circle-radius': 5, 'circle-color': '#f28cb1' });
      initTempLayer(bStore.boxMap, 'tempLineLayer', 'tempLineLayer', 'line', { 'line-color': '#51bbd6', 'line-width': 2 });
  
      const featuresWithSource = getFeatureDataSource(selectedFeatures);
      const allPointGeom = [];
      const allLineGeom = [];
  
      featuresWithSource.forEach(({ feature, source }) => {
        const mappedFeature = {
          objectID: feature.properties.ObjectID, fcode: feature.properties.FCODE, pcdybh: feature.properties.PCDYBH, featureid: feature.properties.FEATUREID, sswz: feature.properties.SSWZ, zfzgbm: feature.properties.ZFZGBM, yydw: feature.properties.YYDW, txjydw: feature.properties.TXJYDW, jsdw: feature.properties.JSDW, sjdw: feature.properties.SJDW, kcdw: feature.properties.KCDW, sgdw: feature.properties.SGDW, gxqddh: feature.properties.GXQDDH, tz: feature.properties.TZ, fsw: feature.properties.FSW, dmgc: feature.properties.DMGC, orieniato: feature.properties.ORIENTATIO, jgxz: feature.properties.JGXZ, jgzjhdmcc: feature.properties.JGZJHDMCC, jgcz: feature.properties.JGCZ, jgxs: feature.properties.JGXS, jbs: feature.properties.JBS, js: feature.properties.JS, jbcc: feature.properties.JBCC, jcc: feature.properties.JCC, sfyaqw: feature.properties.SFYAQW, datasource: feature.properties.DATASOPURCE, gxrq: feature.properties.GXRQ, chdw: feature.properties.CHDW, bz: feature.properties.BZ, jcny: feature.properties.JCNY, kssyny: feature.properties.KSSYNY, sjbcsj: feature.properties.SJBCSJ, gxdbh: feature.properties.GXDBH, gxqddh: feature.properties.GXQDDH, gxzddh: feature.properties.GXZDDH, gxqdms: feature.properties.GXQDMS, gxzdms: feature.properties.GXZDMS, gxqddmgc: feature.properties.GXQDDMGC, gxzddmgc: feature.properties.GXZDDMGC, gxqdgdgc: feature.properties.GXQDGDGC, gxzdgdgc: feature.properties.GXZDGDGC, gc: feature.properties.GC, ssjz: feature.properties.SSJZ, sjwd: feature.properties.SJWD, gdbwcl: feature.properties.GDBWCL, gbhd: feature.properties.GBHD, gwyl: feature.properties.GWYL, sjyl: feature.properties.SJYL, dyz: feature.properties.DYZ, ll: feature.properties.LL, lx: feature.properties.LX, fsfs: feature.properties.FSFS, gj: feature.properties.GJ, dmcc: feature.properties.DMCC, gdgcdw: feature.properties.GDGCDW, xlts: feature.properties.XLTS, zks: feature.properties.ZKS, yyks: feature.properties.YYKS, kj: feature.properties.KJ,
          gxzt: feature.properties.GXZT, gdjkxs: feature.properties.GDJKXS, gxafxs: feature.properties.GXAFXS, sfmyszx: feature.properties.SFMYSZX, djqk: feature.properties.DJQK, jcxs: feature.properties.JCXS, sjdxsw: feature.properties.SJDXSW, xzdxsw: feature.properties.XZDXSW, dxssfyfsx: feature.properties.DXSSFYFSX, sgfs: feature.properties.SGFS, sjsynx: feature.properties.SJSYNX, jgsjaqdj: feature.properties.JGSJAQDJ, kzsfld: feature.properties.KZSFLD, kzsflb: feature.properties.KZSFLB, dmhzsjbz: feature.properties.DMHZSJBZ, sfcydzdld: feature.properties.SFCYDZDLD, sfczbldz: feature.properties.SFCZBLDZ, sfcyqbscz: feature.properties.SFCYQBSCZ, mzgdwbjc: feature.properties.MZGDWBJC, sl: feature.properties.Shape_Leng,
        };
  
        const targetArray = queryResult.value[source];
        if (!targetArray.some(item => item.objectID === mappedFeature.objectID)) {
          targetArray.push(mappedFeature);
  
          if (source.includes("POINT")) {
            sStore.incrementPointCount(source.split('_')[0]);
            allPointGeom.push({ type: "Feature", geometry: feature.geometry, properties: feature.properties });
          } else if (source.includes("LINE")) {
            addLineLengthToStats(source.split('_')[0], mappedFeature.sl);
            allLineGeom.push({ type: "Feature", geometry: feature.geometry, properties: feature.properties });
          }
  
          setLyrVisible(bStore.boxMap, `${source}_cluster`, false);
          setLyrVisible(bStore.boxMap, `${source}_cluster_count`, false);
          setLyrVisible(bStore.boxMap, source, false);
        }
      });
  
      bStore.boxMap.getSource('tempPointLayer').setData({ type: 'FeatureCollection', features: allPointGeom });
      bStore.boxMap.getSource('tempLineLayer').setData({ type: 'FeatureCollection', features: allLineGeom });
  
      setLyrVisible(bStore.boxMap, "tempPointLayer", true);
      setLyrVisible(bStore.boxMap, "tempLineLayer", true);
    });
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
  </script>
  