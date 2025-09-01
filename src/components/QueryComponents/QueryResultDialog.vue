<template>
    <el-dialog v-model="visible" title="查询结果" width="88%" top="30%" custom-class="custom-dialog" append-to-body>
      <el-tabs v-model="activeTab">
        <template v-for="(tab, index) in tabs" :key="index">
          <el-tab-pane v-if="queryResult[tab.name] && queryResult[tab.name].length > 0" :label="tab.label" :name="tab.name">
            <el-table :data="getPagedData(queryResult[tab.name], currentPage[tab.name])" style="width: 100%">
              <el-table-column v-for="col in tab.columns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width || 'auto'"></el-table-column>
            </el-table>
            <el-pagination :current-page="currentPage[tab.name]" :page-size="pageSize" :total="queryResult[tab.name].length" @current-change="handlePageChange(tab.name, $event)"></el-pagination>
          </el-tab-pane>
        </template>
      </el-tabs>
      <span slot="footer" class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="success" @click="downloadTable" style="margin-left: 1vw">下载表格</el-button>
      </span>
    </el-dialog>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, watch, defineProps, defineEmits } from 'vue';
  import { ElMessage } from 'element-plus';
  import * as XLSX from 'xlsx';
  
  const props = defineProps({
    visible: Boolean,
    queryResult: Object,
  });
  
  const emit = defineEmits(['update:visible', 'download-table']);
  
  const activeTab = ref('WS_POINT');
  const currentPage = reactive({
    WS_POINT: 1,
    YS_POINT: 1,
    WS_LINE: 1,
    YS_LINE: 1,
  });
  const pageSize = 10;
  
  const tabs = [
    {
      name: 'WS_POINT',
      label: '污水井盖',
      columns: pointColumns,
    },
    {
      name: 'YS_POINT',
      label: '雨水井盖',
      columns: pointColumns,
    },
    {
      name: 'WS_LINE',
      label: '污水管线',
      columns: lineColumns,
    },
    {
      name: 'YS_LINE',
      label: '雨水管线',
      columns: lineColumns,
    },
  ];
  
  const getPagedData = (data: any[], currentPage: number) => {
    const start = (currentPage - 1) * pageSize;
    const end = currentPage * pageSize;
    return data.slice(start, end);
  };
  
  const handlePageChange = (tabName: string, page: number) => {
    currentPage[tabName] = page;
  };
  
  const checkAndSetActiveTab = () => {
    if (props.queryResult[activeTab.value] && props.queryResult[activeTab.value].length > 0) {
      return;
    }
    const tabOrder = ['WS_POINT', 'YS_POINT', 'WS_LINE', 'YS_LINE'];
    for (const tab of tabOrder) {
      if (props.queryResult[tab] && props.queryResult[tab].length > 0) {
        activeTab.value = tab;
        return;
      }
    }
    activeTab.value = 'WS_POINT';
  };
  
  watch(props.queryResult, () => {
    checkAndSetActiveTab();
  }, { immediate: true });
  
  const downloadTable = () => {
    const workbook = XLSX.utils.book_new();
    const dataGroups = {
      WS_POINT: props.queryResult.WS_POINT,
      YS_POINT: props.queryResult.YS_POINT,
      WS_LINE: props.queryResult.WS_LINE,
      YS_LINE: props.queryResult.YS_LINE,
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
  
  watch(() => props.visible, (newValue) => {
    emit('update:visible', newValue);
  });
  </script>
  