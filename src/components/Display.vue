<!--
* @Author: lihua
* @Description: 数据展示组件
* @time:
-->

<template>
  <div class="display-container">
    <div class="close" @click="close">关闭</div>
    <div class="title">
      查询结果
    </div>

    <div class="box">

      <el-tabs v-model="activeTab" style="width: 100%">
        <el-tab-pane label="井盖" name="JG">
          <el-table
              :data="tableData"
              style="width: 100%"
              show-overflow-tooltip
          >
            <el-table-column
                prop="type"
                label="管线类型">
            </el-table-column>
            <el-table-column
                prop="startPoint"
                label="起点点号">
            </el-table-column>
            <el-table-column
                prop="endPoint"
                label="终点点号">
            </el-table-column>
            <el-table-column
                prop="length"
                label="管线长度">
            </el-table-column>
            <el-table-column
                prop="material"
                label="材质">
            </el-table-column>
          </el-table>
          <!-- 分页 -->
          <el-pagination background layout="prev, pager, next" :page-size="pageSize" :current-page="currentPageJG"
                         :total="jgData.length" @current-change="handlePageChangeJG"/>
        </el-tab-pane>


        <el-tab-pane label="管线" name="GX">
          <el-table
              :data="tableData"
              style="width: 100%"
              show-overflow-tooltip
          >
            <el-table-column
                prop="type"
                label="井盖类型">
            </el-table-column>
            <el-table-column
                prop="startPoint"
                label="起点点号">
            </el-table-column>
            <el-table-column
                prop="endPoint"
                label="终点点号">
            </el-table-column>
            <el-table-column
                prop="length"
                label="管线长度">
            </el-table-column>
            <el-table-column
                prop="material"
                label="材质">
            </el-table-column>
          </el-table>
          <!-- 分页 -->
          <el-pagination background layout="prev, pager, next" :page-size="pageSize" :current-page="currentPageGX"
                         :total="gxData.length" @current-change="handlePageChangeGX"/>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import {tableData} from "@/data/tableData";
import {queryStore} from "@/stores";

const store = queryStore()

const activeTab = ref('JG')
// 分页相关数据
const pageSize = ref(10);  // 每页显示的条数
const currentPageJG = ref(1);  // JG 当前页
const currentPageGX = ref(1);  // GX 当前页

// 存储 JG 和 GX 数据
const jgData = ref([]);
const gxData = ref([]);

// 分页后的数据
const paginatedJGData = ref([]);
const paginatedGXData = ref([]);

// 分页计算方法
const getPaginatedData = (data, currentPage, pageSize) => {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return data.slice(start, end);
};

// 更新分页数据
const updatePaginatedJGData = () => {
  paginatedJGData.value = getPaginatedData(jgData.value, currentPageJG.value, pageSize.value);
};

const updatePaginatedGXData = () => {
  paginatedGXData.value = getPaginatedData(gxData.value, currentPageGX.value, pageSize.value);
};

// 处理页码变化
const handlePageChangeJG = (newPage) => {
  currentPageJG.value = newPage;
  updatePaginatedJGData();
};

const handlePageChangeGX = (newPage) => {
  currentPageGX.value = newPage;
  updatePaginatedGXData();
};

const close = () => {
  store.clearTemp()
}
</script>

<style scoped>
@import '@/styles/components/display.scss';
</style>
