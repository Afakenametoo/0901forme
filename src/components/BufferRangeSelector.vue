BufferRangeSelector.vue
<template>
    <div class="buffer-range-selector">
      <button @click="toggleRangeSelector" class="range-toggle">开启缓冲区</button>
      <div v-if="showRangeSelector" class="range-slider">
        <input type="range" min="0" max="1000" v-model="range" @input="onRangeChange" />
        <span>当前范围: {{ range }} 米</span>
        <button @click="calculateBuffer" class="calculate-button">计算</button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { defineEmits } from 'vue';
  
  const showRangeSelector = ref(false);
  const range = ref(0);
  
  const emit = defineEmits(['rangeChanged', 'calculateBuffer']);
  
  const toggleRangeSelector = () => {
    showRangeSelector.value = !showRangeSelector.value;
  };
  
  const onRangeChange = (event: Event) => {
    const newRange = (event.target as HTMLInputElement).value;
    console.log('缓冲区范围改变:', newRange);
    emit('rangeChanged', newRange);
  };
  
  const calculateBuffer = () => {
    console.log('计算缓冲区范围:', range.value);
    emit('calculateBuffer', range.value);
  };
  </script>
  
  <style scoped>
  .buffer-range-selector {
    position: absolute;
    top: 8vh;
    right: 17vw;
    z-index: 1000;
  }
  
  .range-toggle {
    padding: 5px 10px;
    background-color: #4a90e2;
    color: white;
    border: none;
    cursor: pointer;
  }
  
  .range-slider {
    margin-top: 5px;
    background-color: white;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  
  .range-slider input {
    width: 100%;
  }
  
  .range-slider span {
    display: block;
    margin-top: 5px;
  }
  
  .calculate-button {
    margin-top: 10px;
    padding: 5px 10px;
    background-color: #28a745;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }
  </style>
  