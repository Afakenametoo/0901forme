<template>
    <div class="query-container">
      <div class="title">信息查询</div>
      <div class="box">
        <div class="left-box">
          <el-button v-for="item in query.queryList" :key="item.id" class="left-box-button" @click="onQueryClick(item.id)">
            {{ item.name }}
          </el-button>
        </div>
  
        <!-- 空间查询 -->
        <div v-if="activeQueryType === 1" class="right-s-box">
          <div class="right-box-title">
            <span>选择方式：</span>
          </div>
          <el-radio-group class="right-box-group" v-model="query.radio" type="vertical" @change="handleSelectionChange">
            <el-radio class="radio-btn" :value="1">点选</el-radio>
            <el-radio class="radio-btn" :value="2">框选</el-radio>
          </el-radio-group>
          <el-button style="display: flex; margin-left: 10px;" size="small" class="clear-btn-1"
            @click="clearStreetSelection" @keydown.space.prevent>
            清除框选
          </el-button>
        </div>
        <!-- 条件查询 -->
        <div v-if="activeQueryType === 2" class="right-t-box">
          <!-- 按查询分类渲染 -->
          <div v-for="(options, queryType) in queryOptions" :key="queryType" class="right-t-box-select">
            <span class="label-text">按{{ queryType }}查询:</span>
            <el-select filterable clearable placeholder="请输入查询区域" v-model="selectedOptions[queryType]"
              @clear="clearStreetSelection" class="select-input">
              <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </div>
          <!-- 查询按钮组 -->
          <div class="right-t-box-but">
            <el-button type="primary" plain @click="submitQuery" class="query-btn">查询</el-button>
            <el-button type="warning" plain @click="clearStreetSelection" class="clear-btn-2">清除</el-button>
          </div>
          <el-divider><i class="el-icon-arrow-up"></i></el-divider>
        </div>
  
        <!-- 弹出框显示查询结果 -->
        <el-dialog v-model="dialogVisible" title="查询结果" width="88%" top="30%" custom-class="custom-dialog" append-to-body>
          <!-- Tab导航 -->
          <el-tabs v-model="activeTab">
            <!-- 动态生成 Tab -->
            <template v-for="(tab, index) in tabs" :key="index">
              <el-tab-pane v-if="queryResult[tab.name] && queryResult[tab.name].length > 0" :label="tab.label"
                :name="tab.name">
                <el-table :data="getPagedData(queryResult[tab.name], currentPage[tab.name])" style="width: 100%">
                  <el-table-column v-for="col in tab.columns" :key="col.prop" :prop="col.prop" :label="col.label"
                    :width="col.width || 'auto'"></el-table-column>
                </el-table>
                <el-pagination :current-page="currentPage[tab.name]" :page-size="pageSize"
                  :total="queryResult[tab.name].length"
                  @current-change="handlePageChange(tab.name, $event)"></el-pagination>
              </el-tab-pane>
            </template>
          </el-tabs>
          <!-- 对话框底部按钮 -->
          <span slot="footer" class="dialog-footer">
            <el-button @click="dialogVisible = false">关闭</el-button>
            <el-button type="success" @click="downloadTable" style="margin-left: 1vw">下载表格</el-button>
          </span>
        </el-dialog>
  
        <!-- 查询结果展示按钮 -->
        <el-button type="primary" class="fixed-btn" @click="openDialog"
          style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
          展示查询数据
        </el-button>
  
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, ref, onMounted } from 'vue';
  import { baseStore, layerStore, statisticsStore } from "@/stores";
  import axios from 'axios';
  import { ElMessage, ElPagination } from 'element-plus';
  import { getAllStreet } from "@/services/query";
  import * as XLSX from 'xlsx'; // 导入 xlsx 库
  import { nextTick } from 'vue';
  import { parse } from 'terraformer-wkt-parser';
  import { setLyrVisible, setLayerCursor, setLayerListen, removeListen, setCtxtListen, removeClickedFeas, setLayerVisible } from "@/utils/map";
  import { pointColumns, lineColumns } from '../data/queryData'; // 导入字段映射
  import { baseLayer, specialLayer } from "@/data/layerConfig";
  import * as turf from '@turf/turf';
  import * as mapboxgl from 'mapbox-gl';
  const store = layerStore();
  const bStore = baseStore();
  const sStore = statisticsStore();
  const query = reactive({
    radio: 0,
    queryList: [
      { id: 1, name: "空间查询" },
      { id: 2, name: "条件查询" }
    ],
  });
  
  const activeQueryType = ref<number>(1);
  const isDisabled = ref(false);
  
  const streetData = ref<{ label: string, value: string }[]>([]);
  const selectedStreet = ref<string | null>(null);//存储选中的街道
  
  //条件查询分类
  const roadOptions = ref<{ label: string, value: string }[]>([]);
  const narrowOptions = ref<{ label: string, value: string }[]>([]);
  const otherOptions = ref<{ label: string, value: string }[]>([]);
  const selectedRoad = ref<string | null>(null);
  const selectedNarrow = ref<string | null>(null);
  const selectedOther = ref<string | null>(null);
  
  const dialogVisible = ref(false);
  const activeTab = ref('WS_POINT'); // 当前选中的tab
  
  const matchedLayers: any[] = [];
  const selectedLayers: string[] = [];
  
  // 条件查询分类
  const queryOptions = ref({
    '道路': roadOptions,
    '弄巷': narrowOptions,
    '其他': otherOptions
  });
  const selectedOptions = reactive({
    '道路': null,
    '弄巷': null,
    '其他': null
  });
  const queryResult = ref({
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
  const pageSize = 10; // 每页显示的条目数
  
  // Tab 配置
  const tabs = [
    {
      name: 'WS_POINT',
      label: '污水井盖',
      columns: pointColumns, // 使用点数据的字段映射
    },
    {
      name: 'YS_POINT',
      label: '雨水井盖',
      columns: pointColumns, 
    },
    {
      name: 'WS_LINE',
      label: '污水管线',
      columns: lineColumns, // 使用线数据的字段映射
    },
    {
      name: 'YS_LINE',
      label: '雨水管线',
      columns: lineColumns, 
    },
  ];
  
  // 获取分页数据
  const getPagedData = (data: any[], currentPage: number) => {
    const start = (currentPage - 1) * pageSize;
    const end = currentPage * pageSize;
    return data.slice(start, end);
  };
  
  // 处理分页变化
  const handlePageChange = (tabName: string, page: number) => {
    currentPage[tabName] = page;
  };
  
  // 获取每个类型的数据列
  const getColumns = (type: string) => {
    if (type === 'WS_POINT' || type === 'YS_POINT') {
      return pointColumns; // 返回点数据的列映射
    } else if (type === 'WS_LINE' || type === 'YS_LINE') {
      return lineColumns; // 返回线数据的列映射
    }
    return [];
  };
  
  // 检查并设置第一个有数据的 tab
  const checkAndSetActiveTab = () => {
    if (queryResult.value[activeTab.value] && queryResult.value[activeTab.value].length > 0) {
      return; // 当前 Tab 有数据，无需切换
    }
    // 设置为第一个有数据的 Tab
    const tabOrder = ['WS_POINT', 'YS_POINT', 'WS_LINE', 'YS_LINE']; // Tab 的优先级顺序
    for (const tab of tabOrder) {
      if (queryResult.value[tab] && queryResult.value[tab].length > 0) {
        activeTab.value = tab;
        return;
      }
    }
    // 如果所有 Tab 都没有数据，设置默认 Tab
    activeTab.value = 'WS_POINT';
  };
  
  // 监听 queryResult 数据的变化
  watch(queryResult, () => {
    checkAndSetActiveTab();
  }, { immediate: true });
  
  // 点击查询按钮
  const onQueryClick = (id: number) => {
    activeQueryType.value = id;
  };
  
  /**
   * @description: 获取已选择的图层
   * @return {*}
   */
  const getSelectedLayers = () => {
    const specialLayer = store.getSpecialLayer();
    // 检查是否加载图层
    if (!specialLayer || specialLayer.length === 0) {
      ElMessage({
        message: '请加载专题图层！',
        type: 'warning',
        duration: 3000
      });
      return;
    }
    const layers: string[] = [];
    // 根据当前图层信息，选择对应的图层名
    specialLayer.forEach((layerId) => {
      switch (layerId) {
        case 3:
          layers.push('雨水井盖');
          selectedLayers.push("YS_POINT");
          selectedLayers.push("YS_POINT_cluster")
          break;
        case 4:
          layers.push('污水井盖');
          selectedLayers.push("WS_POINT");
          selectedLayers.push("WS_POINT_cluster")
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
    //去除动画
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
  }
  
  /**
   * @description: 提交街道查询请求
   * @return {*}
   */
  const submitQuery = async () => {
    // 获取所有选中的查询条件
    const selectedStreets = Object.values(selectedOptions).filter(Boolean);
    // 确保至少选择一个查询条件
    if (selectedStreets.length === 0) {
      ElMessage({
        message: "请选择至少一个查询条件",
        type: "warning",
        duration: 3000,
      });
      return;
    }
    // 构造查询参数，仅包含非空值
    const queryParams = {
      type: getSelectedLayers(), // 获取选中的图层类型
      street: selectedStreets,    // 只包含非空的查询条件
    };
    removeAnime(); //移除动画
  
    try {
      const response = await axios.post('/underground/search/listInfoByTypeAndStreet', JSON.stringify(queryParams), {
        headers: { 'Content-Type': 'application/json' }
      });
  
      // 清空之前的查询结果
      queryResult.value = { WS_POINT: [], YS_POINT: [], WS_LINE: [], YS_LINE: [] };
      let allGeojson = [];
      //初始化右侧统计数据为0
      sStore.resetStatistics();
  
      // 处理响应数据
      const processData = (dataKey, layerKey, sourceKey) => {
        if (response.data.data[dataKey]) {
          queryResult.value[layerKey] = response.data.data[dataKey];
          setLyrVisible(bStore.boxMap, `${layerKey}_cluster`, false);
          setLyrVisible(bStore.boxMap, `${layerKey}_cluster_count`, false);          
          setLyrVisible(bStore.boxMap, layerKey, false);
  
          const geojsonFeatures = response.data.data[dataKey].map(item => {
            if(layerKey.includes("POINT")){ sStore.incrementPointCount(dataKey.slice(0,2)) }
            if(layerKey.includes("LINE")){ addLineLengthToStats(dataKey.slice(0,2),String(item.shapeLeng)) }
            const geojson = parse(item.geom);
            allGeojson.push({ type: 'Feature', geometry: geojson, properties: item.sswz });
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
  
      processData('WSJG', 'WS_POINT', 'wsTempPointLayer');
      processData('YSJG', 'YS_POINT', 'ysTempPointLayer');
      processData('WSGX', 'WS_LINE', 'wsTempLineLayer');
      processData('YSGX', 'YS_LINE', 'ysTempLineLayer');
      setLyrVisible(bStore.boxMap, "wsTempPointLayer", true);
      setLyrVisible(bStore.boxMap, "wsTempLineLayer", true);
      setLyrVisible(bStore.boxMap, "ysTempPointLayer", true);
      setLyrVisible(bStore.boxMap, "ysTempLineLayer", true);
  
      // 添加图层到地图
      const addLayerIfNotExists = (layerId, sourceId, type, paint) => {
        if (!bStore.boxMap.getLayer(layerId)) {
          bStore.boxMap.addLayer({ id: layerId, type, source: sourceId, paint });
        }
      };
  
      addLayerIfNotExists('wsTempLineLayer', 'wsTempLineLayer', 'line', { 'line-color': '#fe5708', 'line-width': 4 });
      addLayerIfNotExists('wsTempPointLayer', 'wsTempPointLayer', 'circle', { 'line-color': '#fe5708', 'line-width': 4 });
      addLayerIfNotExists('ysTempLineLayer', 'ysTempLineLayer', 'line', { 'line-color': '#0000ff', 'line-width': 4 });
      addLayerIfNotExists('ysTempPointLayer', 'ysTempPointLayer', 'circle', { 'line-color': '#0292d5', 'line-width': 4 });
  
      // 计算所有 GeoJSON 数据的边界框
      let bounds = allGeojson.reduce((acc, geojson) => {
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
  
      // 跳转并缩放地图到边界框
      if (bounds && bounds.every(val => !isNaN(val))) {
        bStore.boxMap.fitBounds(bounds, { padding: 50, maxZoom: 16 });
      }
  
      ElMessage({ message: '查询成功', type: 'success', duration: 3000 });
    } catch (error) {
      console.error('查询失败:', error);
      ElMessage({ message: '查询失败，请稍后重试。', type: 'error', duration: 3000 });
    }
  };
  
  
  /**
   * @description: 清除函数
   * @return {*}
   */
  const clearStreetSelection = () => {
    // 选项框置空
    selectedStreet.value = null;
    selectedRoad.value = null;
    selectedNarrow.value = null;
    selectedOther.value = null;
  
    // 移除 temp 图层
    setLyrVisible(bStore.boxMap, "wsTempPointLayer", false);
    setLyrVisible(bStore.boxMap, "wsTempLineLayer", false);
    setLyrVisible(bStore.boxMap, "ysTempPointLayer", false);
    setLyrVisible(bStore.boxMap, "ysTempLineLayer", false);
  
    // 定义需要处理的图层类型
    const layerTypes = ["YS_POINT", "WS_POINT", "YS_LINE", "WS_LINE"];
  
    // 遍历图层类型，恢复可见性
    layerTypes.forEach(type => {
      if (queryResult.value[type] && queryResult.value[type].length > 0) {
        setLyrVisible(bStore.boxMap, `${type}_cluster`, true);
        setLyrVisible(bStore.boxMap, `${type}_cluster_count`, true);
        setLyrVisible(bStore.boxMap, type, true);
      }
    });
  
    // 清空之前的查询结果
    queryResult.value = { WS_POINT: [], YS_POINT: [], WS_LINE: [], YS_LINE: [] };
  
    // 重新请求所有道路名称
    queryAllRoads();
  
    // 清除数据统计
    sStore.WS_POINT_COUNT = 25594;
    sStore.YS_POINT_COUNT = 9593;
    sStore.WS_LINE_LENGTH = 260.425;
    sStore.YS_LINE_LENGTH = 425.792;
  
    // 处理特殊图层
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
  };
  
  // 打开 dialog 展示查询结果
  const openDialog = () => {
    dialogVisible.value = true;
    nextTick(() => {
      console.log("Dialog should be visible now.", dialogVisible.value);
    });
  };
  
  /**
   * @description: 下载表格
   * @return {*}
   */
  const downloadTable = () => {
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
  
    // 数据分组
    const dataGroups = {
      WS_POINT: queryResult.value.WS_POINT,
      YS_POINT: queryResult.value.YS_POINT,
      WS_LINE: queryResult.value.WS_LINE,
      YS_LINE: queryResult.value.YS_LINE,
    };
  
    // 为每个数据组创建独立的 sheet
    Object.entries(dataGroups).forEach(([sheetName, data]) => {
      let columns = [];
  
      // 根据数据类型选择字段映射
      if (sheetName.includes('POINT')) {
        columns = pointColumns;
      } else if (sheetName.includes('LINE')) {
        columns = lineColumns;
      }
  
      if (data.length > 0) {
        // 根据 columns 映射数据
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
  
    // 导出为 Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  
    // 创建下载链接
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '查询结果.xlsx';
    link.click();
  };
  
  /**
   * @description: 初始化临时图层
   * @param {*} map
   * @param {*} sourceId
   * @param {*} layerId
   * @param {*} layerType
   * @param {*} paint
   * @return {*}
   */
  const initTempLayer = (map: any, sourceId: string, layerId: string, layerType: string, paint: any) => {
    // 检查并移除旧的图层和数据源
    if (map.getLayer(layerId)) {
      console.warn(`Layer '${layerId}' already exists. Removing old layer.`);
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      console.warn(`Source '${sourceId}' already exists. Removing old source.`);
      map.removeSource(sourceId);
    }
    // 添加数据源
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    // 添加图层
    map.addLayer({
      id: layerId,
      type: layerType,
      source: sourceId,
      paint: paint
    });
  };
  
  /**
   * @description: 获取已加载的图层的 所有道路名称
   * @return {*}
   */
  const queryAllRoads = () => {
    // 请求数据逻辑
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
  
        // 按不同类型分类
        roadOptions.value = streetData.value.filter(item => /路$|道$|线$/.test(item.value));
        narrowOptions.value = streetData.value.filter(item => /弄$|巷$|街$/.test(item.value));
        otherOptions.value = streetData.value.filter(item => !/路$|道$|线$|弄$|巷$|街$/.test(item.value));
      })
      .catch((error) => {
        console.error('请求失败:', error);
      });
  };
  
  //切换点选框选功能
  const handleSelectionChange = (value: number) => {
    if (value === 1) {
      activatePointSelect();
      isDisabled.value = true;
      clearStreetSelection();
  
    } else if (value === 2) {
      activateBoxSelect();
      isDisabled.value = false;
      //移除动画
      removeClickedFeas(bStore.boxMap);
      //移除高亮
      clearAllHighlights(bStore.boxMap, matchedLayers);
      //移除鼠标样式
      findMatchingLayers(specialLayer, matchedLayers).forEach(item => {
        setLayerCursor(toRaw(bStore.boxMap), item.name, false);
      });
  
    } else {
      findMatchingLayers(specialLayer, matchedLayers).forEach((item) => {
        setCtxtListen(toRaw(bStore.boxMap), 'geojson')
        // 移除点选
        removeListen(toRaw(bStore.boxMap), item.name);
      });
      isDisabled.value = true;
    }
  };
  
  // 递归查找函数
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
    //雨污水管线id
    const childrenArray = [3, 4, 5, 6];
    // 获取命中的 specialLayer 对象
    store.getSpecialLayer().forEach((item: any) => {
      if (childrenArray.includes(item)) {
        matchedLayers.push(item);
      }
    });
  }
  
  // 激活点选功能
  const activatePointSelect = () => {
    findMatchingLayers(specialLayer, matchedLayers).forEach(item => {
      setLayerListen(toRaw(bStore.boxMap), item.mapping, item)
      setLayerCursor(toRaw(bStore.boxMap), item.name, true)
    })
  
    // 清空之前的查询结果
    queryResult.value = { WS_POINT: [], YS_POINT: [], WS_LINE: [], YS_LINE: [] };
  
  };
  
  // 提取数值并转换为米，然后累加到全局变量
  function addLineLengthToStats(type: "WS" | "YS", lengthStr: string) {
    // 提取数值部分，例如从 "35.88 m" 提取出 35.88
    const lengthInMeters = parseFloat(lengthStr.replace(/[^\d.]/g, "")) || 0;
  
    // 累加到对应的变量，并转换为千米
    const lengthInKm = lengthInMeters / 1000;
  
    if (type === "WS") {
      sStore.WS_LINE_LENGTH += lengthInKm;
    } else if (type === "YS") {
      sStore.YS_LINE_LENGTH += lengthInKm;
    }
  }
  
  const loadActivateBoxSelect = (
    map: any, // Mapbox地图实例
    selectedLayers: string[], // 需要选中的图层名称数组
    onFeaturesSelected: (features: any[], polygon: GeoJSON.Polygon) => void // 选中要素后的回调函数
  ) => {
    let points: [number, number][] = []; // 存储多边形选区的点坐标
    let isBoxSelecting = false; // 是否正在绘制选区
    const canvas = map.getCanvasContainer(); // 获取地图画布容器
    const selectionLayerId = "box-select-border"; // 选区边框图层的ID
  
    // 禁用地图的交互功能（如拖拽、缩放等）
    const disableMapInteractivity = () => {
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
    };
  
    // 启用地图的交互功能
    const enableMapInteractivity = () => {
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.boxZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
    };
  
    // 移除选区边框图层和源
    const removeSelectionBorder = () => {
      if (map.getLayer(`${selectionLayerId}-border`)) map.removeLayer(`${selectionLayerId}-border`);
      if (map.getLayer(selectionLayerId)) map.removeLayer(selectionLayerId);
      if (map.getSource(selectionLayerId)) map.removeSource(selectionLayerId);
    };
  
    // 绘制选区边框
    const drawSelectionBorder = (polygonCoords: [number, number][]) => {
      const polygon = { type: "Feature", geometry: { type: "Polygon", coordinates: [polygonCoords] } };
      if (map.getSource(selectionLayerId)) {
        // 如果源已存在，更新数据
        map.getSource(selectionLayerId).setData(polygon);
      } else {
        // 如果源不存在，创建新的源和图层
        map.addSource(selectionLayerId, { type: "geojson", data: polygon });
        map.addLayer({
          id: selectionLayerId,
          type: "fill",
          source: selectionLayerId,
          paint: { "fill-color": "rgba(250, 180, 74, 0.3)", "fill-outline-color": "#f25e46" },
        });
        map.addLayer({
          id: `${selectionLayerId}-border`,
          type: "line",
          source: selectionLayerId,
          paint: { "line-color": "#f25e46", "line-width": 2 },
        });
      }
    };
  
    // 键盘按下事件处理
    const onKeyDown = (e: KeyboardEvent) => {
      //去除动画
      removeAnime();
      if (e.key === " " && !isBoxSelecting) {
        isBoxSelecting = true; // 开始绘制选区
        points = []; // 重置点集
        disableMapInteractivity(); // 禁用地图交互
        canvas.style.cursor = "crosshair"; // 设置鼠标样式为十字准星
      }
    };
  
    // 键盘松开事件处理
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " && isBoxSelecting) {
        isBoxSelecting = false; // 结束绘制选区
        canvas.style.cursor = ""; // 恢复鼠标样式
        enableMapInteractivity(); // 启用地图交互
  
        if (points.length > 2) {
          // 如果点数大于2，闭合多边形
          const polygonCoords = [...points, points[0]];
          const polygon = turf.polygon([polygonCoords]); // 使用Turf.js创建多边形
          const polygonGeometry = polygon.geometry;
  
          const selectedFeatures: any[] = []; // 存储选中的要素
          const selectedFeatureIds: Set<string> = new Set(); // 用于去重
          const pendingClusterResolutions: Promise<void>[] = []; // 处理异步的聚合点展开
  
          // 遍历选中的图层
          selectedLayers.forEach((layerName) => {
            const features = map.queryRenderedFeatures({ layers: [layerName] }); // 查询当前图层中渲染的要素
            features.forEach((feature: any) => {
              const geometryType = feature.geometry.type;
              const featureCoordinates = feature.geometry.coordinates;
  
              if (geometryType === "Point") {
                // 处理点要素
                if (feature.properties?.cluster && turf.booleanPointInPolygon(featureCoordinates, polygonGeometry)) {
                  // 如果是聚合点，展开聚合点
                  const clusterId = feature.properties.cluster_id;
                  const pointCount = feature.properties.point_count;
                  const source = map.getSource(feature.source);
  
                  const clusterResolution = new Promise<void>((resolve) => {
                    source.getClusterLeaves(clusterId, pointCount, 0, (err: any, leaves: any[]) => {
                      if (err) return resolve();
                      leaves.forEach((leaf) => {
                        leaf.source = feature.source;
                        leaf.layer = feature.layer;
                        selectedFeatures.push(leaf); // 将叶子节点加入选中列表
                      });
                      resolve();
                    });
                  });
                  pendingClusterResolutions.push(clusterResolution);
                } else {
                  // 如果是普通点，直接判断是否在多边形内
                  const featurePoint = turf.point(featureCoordinates);
                  if (turf.booleanPointInPolygon(featurePoint, polygonGeometry)) selectedFeatures.push(feature);
                }
              } else if (geometryType === "LineString" || geometryType === "MultiLineString") {
                // 处理线要素
                const featureLine = turf.lineString(featureCoordinates);
                const lineStringId = feature.properties?.id || JSON.stringify(featureCoordinates);
                if (!selectedFeatureIds.has(lineStringId) && turf.booleanIntersects(featureLine, polygonGeometry)) {
                  selectedFeatures.push(feature); // 将线要素加入选中列表
                  selectedFeatureIds.add(lineStringId); // 标记为已选
                }
              }
            });
          });
  
          // 等待所有异步操作完成，然后调用回调函数
          Promise.all(pendingClusterResolutions).then(() => onFeaturesSelected(selectedFeatures, polygonGeometry));
        }
  
        removeSelectionBorder(); // 移除选区边框
        points = []; // 重置点集
      }
    };
  
    // 鼠标按下事件处理
    const onMouseDown = (e: MouseEvent) => {
      if (!isBoxSelecting || e.button !== 0) return; // 仅处理左键点击
      e.preventDefault();
  
      const mapPoint = map.unproject(new mapboxgl.Point(e.clientX, e.clientY)); // 将屏幕坐标转换为地图坐标
      points.push([mapPoint.lng, mapPoint.lat]); // 将点加入点集
  
      if (points.length > 1) drawSelectionBorder([...points, points[0]]); // 绘制选区边框
    };
  
    // 鼠标移动事件处理
    const onMouseMove = (e: MouseEvent) => {
      if (!isBoxSelecting || points.length < 1) return;
  
      const movingPoint = map.unproject(new mapboxgl.Point(e.clientX, e.clientY)); // 获取当前鼠标位置
      drawSelectionBorder([...points, [movingPoint.lng, movingPoint.lat], points[0]]); // 动态绘制选区边框
    };
  
    // 初始化选区功能
    const initBoxSelect = () => {
      canvas.addEventListener("mousedown", onMouseDown);
      canvas.addEventListener("mousemove", onMouseMove);
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);
    };
  
    // 移除选区功能
    const removeBoxSelect = () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      enableMapInteractivity(); // 恢复地图交互
      removeSelectionBorder(); // 移除选区边框
    };
  
    initBoxSelect(); // 初始化
    return removeBoxSelect; // 返回移除选区功能的函数
  };
  
  // 开启框选
  const activateBoxSelect = () => {
    // 提示用户操作
    ElMessage({
      message: '按住空格开始点击框选，松开空格停止',
      type: 'warning',
      duration: 3000,
    });
  
    // 移除点选监听器并设置图层光标
    findMatchingLayers(specialLayer, matchedLayers).forEach((item) => {
      removeListen(toRaw(bStore.boxMap), item.name);
      setLayerCursor(toRaw(bStore.boxMap), item.name, false);
    });
  
    // 激活框选功能
    loadActivateBoxSelect(bStore.boxMap, selectedLayers, (selectedFeatures) => {
      if (!selectedFeatures || selectedFeatures.length === 0) return;
  
      // 初始化或清空查询结果
      queryResult.value = queryResult.value || { WS_POINT: [], YS_POINT: [], WS_LINE: [], YS_LINE: [] };
      Object.keys(queryResult.value).forEach(key => queryResult.value[key] = []); // 清空上次结果
      sStore.resetStatistics(); // 重置统计数据
  
      // 获取选中要素的数据源并分类处理
      const featuresWithSource = getFeatureDataSource(selectedFeatures);
      const wsPointGeom = []; 
      const wsLineGeom = []; 
      const ysPointGeom = []; 
      const ysLineGeom = []; 
  
      // 初始化临时图层
      initTempLayer(bStore.boxMap, 'wsTempPointLayer', 'wsTempPointLayer', 'circle', { 'circle-radius': 8, 'circle-color': '#fe5708' });
      initTempLayer(bStore.boxMap, 'wsTempLineLayer', 'wsTempLineLayer', 'line', { 'line-color': '#fe5708', 'line-width': 5 });
      initTempLayer(bStore.boxMap, 'ysTempPointLayer', 'ysTempPointLayer', 'circle', { 'circle-radius': 8, 'circle-color': '#0000ff' });
      initTempLayer(bStore.boxMap, 'ysTempLineLayer', 'ysTempLineLayer', 'line', { 'line-color': '#0000ff', 'line-width': 5 });
  
      featuresWithSource.forEach(({ feature, source }) => {
        // 映射要素属性
        const mappedFeature = {
          objectID: feature.properties.ObjectID, fcode: feature.properties.FCODE, pcdybh: feature.properties.PCDYBH, featureid: feature.properties.FEATUREID, sswz: feature.properties.SSWZ, zfzgbm: feature.properties.ZFZGBM, yydw: feature.properties.YYDW, txjydw: feature.properties.TXJYDW, jsdw: feature.properties.JSDW, sjdw: feature.properties.SJDW, kcdw: feature.properties.KCDW, sgdw: feature.properties.SGDW, gxqddh: feature.properties.GXQDDH, tz: feature.properties.TZ, fsw: feature.properties.FSW, dmgc: feature.properties.DMGC, orieniato: feature.properties.ORIENTATIO, jgxz: feature.properties.JGXZ, jgzjhdmcc: feature.properties.JGZJHDMCC, jgcz: feature.properties.JGCZ, jgxs: feature.properties.JGXS, jbs: feature.properties.JBS, js: feature.properties.JS, jbcc: feature.properties.JBCC, jcc: feature.properties.JCC, sfyaqw: feature.properties.SFYAQW, datasource: feature.properties.DATASOPURCE, gxrq: feature.properties.GXRQ, chdw: feature.properties.CHDW, bz: feature.properties.BZ, jcny: feature.properties.JCNY, kssyny: feature.properties.KSSYNY, sjbcsj: feature.properties.SJBCSJ, gxdbh: feature.properties.GXDBH, gxqddh: feature.properties.GXQDDH, gxzddh: feature.properties.GXZDDH, gxqdms: feature.properties.GXQDMS, gxzdms: feature.properties.GXZDMS, gxqddmgc: feature.properties.GXQDDMGC, gxzddmgc: feature.properties.GXZDDMGC, gxqdgdgc: feature.properties.GXQDGDGC, gxzdgdgc: feature.properties.GXZDGDGC, gc: feature.properties.GC, ssjz: feature.properties.SSJZ, sjwd: feature.properties.SJWD, gdbwcl: feature.properties.GDBWCL, gbhd: feature.properties.GBHD, gwyl: feature.properties.GWYL, sjyl: feature.properties.SJYL, dyz: feature.properties.DYZ, ll: feature.properties.LL, lx: feature.properties.LX, fsfs: feature.properties.FSFS, gj: feature.properties.GJ, dmcc: feature.properties.DMCC, gdgcdw: feature.properties.GDGCDW, xlts: feature.properties.XLTS, zks: feature.properties.ZKS, yyks: feature.properties.YYKS, kj: feature.properties.KJ,
          gxzt: feature.properties.GXZT, gdjkxs: feature.properties.GDJKXS, gxafxs: feature.properties.GXAFXS, sfmyszx: feature.properties.SFMYSZX, djqk: feature.properties.DJQK, jcxs: feature.properties.JCXS, sjdxsw: feature.properties.SJDXSW, xzdxsw: feature.properties.XZDXSW, dxssfyfsx: feature.properties.DXSSFYFSX, sgfs: feature.properties.SGFS, sjsynx: feature.properties.SJSYNX, jgsjaqdj: feature.properties.JGSJAQDJ, kzsfld: feature.properties.KZSFLD, kzsflb: feature.properties.KZSFLB, dmhzsjbz: feature.properties.DMHZSJBZ, sfcydzdld: feature.properties.SFCYDZDLD, sfczbldz: feature.properties.SFCZBLDZ, sfcyqbscz: feature.properties.SFCYQBSCZ, mzgdwbjc: feature.properties.MZGDWBJC, sl: feature.properties.Shape_Leng, // 管线长度
        };
  
        // 根据数据源分类存储并去重
        const targetArray = queryResult.value[source];
        if (!targetArray.some(item => item.objectID === mappedFeature.objectID)) {
          targetArray.push(mappedFeature);

          console.log("SSSSource",source)
  
          // 更新统计数据和图层可见性
          if (source.includes("WS_POINT")) {
            sStore.incrementPointCount(source.split('_')[0]); // 更新点统计
            wsPointGeom.push({ type: "Feature", geometry: feature.geometry, properties: feature.properties });
          } else if (source.includes("WS_LINE")) { 
            addLineLengthToStats(source.split('_')[0], mappedFeature.sl); // 更新线统计
            wsLineGeom.push({ type: "Feature", geometry: feature.geometry, properties: feature.properties });
          } else if (source.includes("YS_POINT")) {
            sStore.incrementPointCount(source.split('_')[0]); // 更新点统计
            ysPointGeom.push({ type: "Feature", geometry: feature.geometry, properties: feature.properties });
          } else if (source.includes("YS_LINE")) { 
            addLineLengthToStats(source.split('_')[0], mappedFeature.sl); // 更新线统计
            ysLineGeom.push({ type: "Feature", geometry: feature.geometry, properties: feature.properties });
          }
  
          // 隐藏原始图层
          setLyrVisible(bStore.boxMap, `${source}_cluster`, false);
          setLyrVisible(bStore.boxMap, `${source}_cluster_count`, false);
          setLyrVisible(bStore.boxMap, source, false);
        }
      });
  
      // 更新临时图层数据
      bStore.boxMap.getSource('wsTempPointLayer').setData({ type: 'FeatureCollection', features: wsPointGeom });
      bStore.boxMap.getSource('wsTempLineLayer').setData({ type: 'FeatureCollection', features: wsLineGeom });
      bStore.boxMap.getSource('ysTempPointLayer').setData({ type: 'FeatureCollection', features: ysPointGeom });
      bStore.boxMap.getSource('ysTempLineLayer').setData({ type: 'FeatureCollection', features: ysLineGeom });
  
      // 显示临时图层
      setLyrVisible(bStore.boxMap, "wsTempPointLayer", true);
      setLyrVisible(bStore.boxMap, "wsTempLineLayer", true);
      setLyrVisible(bStore.boxMap, "ysTempPointLayer", true);
      setLyrVisible(bStore.boxMap, "ysTempLineLayer", true);
    });
  };
  
  // 获取选中 feature 的数据源
  const getFeatureDataSource = (selectedFeatures: any[]) => {
    const featuresWithSource: { feature: any; source: any; }[] = [];
    selectedFeatures.forEach((feature) => {
      const source = feature.source;
      featuresWithSource.push({ feature, source });
    });
    return featuresWithSource;
  };
  
  const clearSelectionStyle = (map: any, layer: any) => {
    if (!map.getLayer(layer.name)) {
      console.warn(`图层 ${layer.name} 不存在，跳过操作`);
      return;
    }
  
    if (layer.type === 'symbol') {
      const iconImage = layer.name === 'WS_POINT' ? 'WS' : 'YS';
      map.setLayoutProperty(layer.name, 'icon-image', iconImage);
    } else if (layer.type === 'line') {
      const lineColor = layer.name === 'WS_LINE' ? '#fe5708' : '#0000ff';
      map.setPaintProperty(layer.name, 'line-color', lineColor);
    }
  };
  
  // 清除框选高亮
  const clearAllHighlights = (map: any, matchedLayers: any) => {
    specialLayer.forEach((group: any) => {
      if (group.children) {
        group.children.forEach((layer: any) => {
          if (matchedLayers.includes(layer.id))
            clearSelectionStyle(map, layer);
        });
      }
    });
  };
  
  onMounted(() => {
    queryAllRoads();
    // 初始化临时图层
    initTempLayer(
      bStore.boxMap,
      'wsTempPointLayer',
      'wsTempPointLayer',
      'circle',
      {
        'circle-radius': 8,
        'circle-color': '#fe5708'
      }
    );
    initTempLayer(
      bStore.boxMap,
      'wsTempLineLayer',
      'wsTempLineLayer',
      'line',
      {
        'line-color': '#fe5708',
        'line-width': 4
      }
    );

    initTempLayer(
      bStore.boxMap,
      'ysTempPointLayer',
      'ysTempPointLayer',
      'circle',
      {
        'circle-radius': 8,
        'circle-color': '#0292d5'
      }
    );
    initTempLayer(
      bStore.boxMap,
      'ysTempLineLayer',
      'ysTempLineLayer',
      'line',
      {
        'line-color': '#0000ff',
        'line-width': 4
      }
    );
    
    getMatchedLayers();
  });
  onUnmounted(() => {
    clearStreetSelection();
    findMatchingLayers(specialLayer, matchedLayers).forEach((item) => {
      // 移除点选
      removeListen(toRaw(bStore.boxMap), item.name);
      setLayerCursor(toRaw(bStore.boxMap), item.name, false);
    });
    isDisabled.value = true;
  
    setCtxtListen(toRaw(bStore.boxMap), 'geojson')
  })
  </script>
  
  <style scoped>
  @import '@/styles/components/query.scss';
  </style>
  