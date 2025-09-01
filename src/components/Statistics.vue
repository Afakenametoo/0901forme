<!--
* @Author: lihua
* @Description: 数据统计
* @time:
-->

<template>
  <div class="statistics-container">
    <div class="title">
      数据统计
    </div>
    <div class="box">
      <div class="tab">
        <el-tabs v-model="statistics.activeName" @tab-click="statistics.handleClick">
          <el-tab-pane label="数量统计" name="first" class="gs-statistic">
            <gs-statistic></gs-statistic>
          </el-tab-pane>
          <el-tab-pane label="条件统计" name="second" class="tj-statistic">
            <tj-statistic></tj-statistic>
          </el-tab-pane>
        </el-tabs>
      </div>
      <div class="operate">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsStatistic from '@/components/GXStatistic.vue'
import tjStatistic from '@/components/TJStatistic.vue'

const statistics = reactive({
  activeName: 'first',
  handleClick: (tab, event) => {
  }
})

</script>

<style scoped>
@import '@/styles/components/statistics.scss';
</style>
