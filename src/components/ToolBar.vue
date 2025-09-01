<!--
 * @Author: lily 784710791@qq.com
 * @Date: 2025-02-18 16:27:35
 * @LastEditTime: 2025-03-05 09:55:28
 * @LastEditors: Sleip
 * @Description: 描述
-->
<template>
  <div class="toolbar" :class="{ expanded: toolbarExpanded }">
      <!-- 初始状态下只有一个按钮 -->
      <button class="toolbar-btn toggle-btn" @click="toggleToolBar" v-if="!toolbarExpanded">
          <img src="@/assets/icons/toolbar.svg" alt="工具栏" />
      </button>

      <!-- 展开状态下显示所有按钮 -->
      <template v-if="toolbarExpanded">
          <button class="toolbar-btn" @click="measureLength">
              <img src="@/assets/icons/length.svg" alt="测量线段" />
              <span>测量线段</span>
          </button>
          <button class="toolbar-btn" @click="measureArea">
              <img src="@/assets/icons/area.svg" alt="测量面积" />
              <span>测量面积</span>
          </button>
          <button class="toolbar-btn" @click="showBufferSlider">
              <img src="@/assets/icons/buffer.svg" alt="缓冲区" />
              <span>缓冲区</span>
          </button>
          <button class="toolbar-btn toggle-btn" @click="clearMeasure">
              <img src="@/assets/icons/dalete.svg" alt="清除" />
              <span>清除</span>
          </button>
          <button class="toolbar-btn" @click="screenCut">
              <img src="@/assets/icons/screencut.svg" alt="截图" />
              <span>截图</span>
          </button>
          <button class="toolbar-btn toggle-btn" @click.stop="toggleToolBar">
              <img src="@/assets/icons/toolbar.svg" alt="工具栏" />
              <span>收起</span>
          </button>
      </template>
  </div>

  <!-- 缓冲区滑动条 -->
  <div v-if="showBufferSliderFlag" class="buffer-slider">
      <span>选择缓冲区范围（米）</span>
      <input type="range" min="10" max="400" v-model.number="bufferDistance"/>
      <div class="buffer-distance-display">
          当前距离: {{ bufferDistance }} 米
      </div>
      <div class="button-group">
          <button @click="createBuffer">点击建立中心点</button>
          <button @click="calculateBuffer">计算</button>
          <button @click="clearBuffers">清除</button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {ElNotification} from "element-plus";
import MeatureTool  from '@/utils/measureTool'
import html2canvas from 'html2canvas';
import BufferTool from '@/utils/bufferTool';
import { baseStore } from "@/stores";

let map: any = null;
let measure: any = null;
let bufferTool: BufferTool | null = null;

const toolbarExpanded = ref(false); // 工具条展开状态
const bStore = baseStore();
const showBufferSliderFlag = ref(false); // 显示缓冲区滑动条
const bufferDistance = ref(200); // 缓冲区距离，默认200米

watch(() => bStore.boxMap, (val:any) => {
    if (val) 
      map=bStore.boxMap
});

/**
* @description: 量测长度
* @return {*}
*/
const measureLength = () => {
  const layerId = "measure_" + String(new Date().getTime());
  if (!measure) {
      measure = new MeatureTool();
  }
  measure.measureDistance(toRaw(map), layerId);
  // 防止函数冲突
  measure.setDistance();
}

/**
* @description: 量测面积
* @return {*}
*/
const measureArea = () => {
  const layerId = "measure_" + String(new Date().getTime());
  if (!measure) measure = new MeatureTool();
  measure.measureArea(toRaw(map), layerId);
  // 防止函数冲突
  measure.setArea();
}

/**
* @description: 清除测量结果
* @return {*}
*/
const clearMeasure = () => {
  if (measure) measure.clearMeasureAll(toRaw(map));
  clearBuffers();
};

/**
 * @description: 截图
 * @return {*}
 */
const screenCut =async () => {
  try{
    const element = document.getElementById('baseMap'); // 你想要截图的元素
    if(element==null){
      ElNotification.error({
        title: '截图失败',
        message: '未找到地图元素，请检查地图是否加载成功。',
        position: 'bottom-right'
      })
      return
    }
    else{
      const canvas = await html2canvas(element, { useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      handleCallback({base64:dataUrl})
    } 
  }
  catch(error){
    console.log(error)
  }
}

/**
* @description: 截图回调
* @param {any} value
* @return {*}
*/
const handleCallback = (value: any) => {
  // 解析 Base64 数据
  var blob = base64ToBlob(value.base64);
  //创建下载链接
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `xcdxgx_${Date.now()}.png`;
  a.click();
  //提示
  ElNotification.success({
      title: '截图成功',
      message: '截图已保存至本地。',
      position: 'bottom-right'
  });
}

// 将 Base64 数据解析为 Blob 对象
const base64ToBlob = (base64data:string) =>{
  var arr = base64data.split(',');
  var mime = arr[0].match(/:(.*?);/)[1];
  var bstr = atob(arr[1]);
  var n = bstr.length;
  var u8arr = new Uint8Array(n);

  while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

// 切换工具条展开状态
const toggleToolBar = () => {
  toolbarExpanded.value = !toolbarExpanded.value;
};

// 显示缓冲区滑动条
const showBufferSlider = () => {
  if (bufferTool) {
      bufferTool.clearBuffers(); // 确保清除之前的缓冲区
  }
  bufferTool = new BufferTool(); // 重新初始化 bufferTool
  showBufferSliderFlag.value = !showBufferSliderFlag.value;
};

// 创建缓冲区
const createBuffer = () => {
  if (bufferTool) {
      console.log('createBuffer called with bufferDistance:', bufferDistance.value);
      bufferTool.startCreatingBuffer(bufferDistance.value);
  } else {
      console.error('BufferTool is not initialized');
  }
};

// 计算缓冲区
const calculateBuffer = () => {
  if (bufferTool) {
      console.log('calculateBuffer called');
      bufferTool.calculateBuffer();
  } else {
      console.error('BufferTool is not initialized');
  }
};

// 清除缓冲区
const clearBuffers = () => {
  if (bufferTool) {
      console.log('clearBuffers called');
      bufferTool.clearBuffers();
      showBufferSliderFlag.value = false; // 关闭缓冲区滑动条
  } else {
      console.error('BufferTool is not initialized');
  }
};
</script>

<style scoped>
@import "@/styles/components/toolbar.scss";
</style>
