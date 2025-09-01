<!--
 * @Author: Sleip
 * @Date: 2025-02-19 10:51:54
 * @LastEditors: Sleip
 * @LastEditTime: 2025-02-19 10:55:16
 * @FilePath: \underground_pipelines_display\src\components\QueryComponents\QueryButtons.vue
 * @Description: 
 * 
 * Copyright (c) 2025 by Sleip, All Rights Reserved. 
-->
<template>
    <div class="left-box">
      <el-button v-for="item in queryList" :key="item.id" class="left-box-button" @click="onQueryClick(item.id)">
        {{ item.name }}
      </el-button>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  
  const queryList = [
    { id: 1, name: "空间查询" },
    { id: 2, name: "条件查询" }
  ];
  
  const emit = defineEmits(['query-click']);
  
  const onQueryClick = (id: number) => {
    emit('query-click', id);
  };
  </script>
  