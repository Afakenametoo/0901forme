<!--
* @Author: lihua
* @Description: 管线统计
* @time:
-->

<template>
  <div class="gx-container">
    <div class="top-container">
      <div class="select-box">
        <div class="title">类型选择</div>
        <div class="content">
          <el-radio-group
              v-model="GXToolbar.typeRadio"
          >
            <el-radio :value="1" :label="1">WIFI</el-radio>
            <!-- <el-radio :value="2" :label="2">管线</el-radio> -->
            
          </el-radio-group>
        </div>
      </div>
      <el-divider><i class="el-icon-arrow-up"></i></el-divider>
    </div>
    <div v-show="GXToolbar.typeRadio !== 0" class="bottom-container">
      <div class="left-container" id="left-container">
        左侧盒子
      </div>
      <div class="right-container" id="right-container">
        右侧盒子
      </div>
    </div>
    <div v-show="GXToolbar.typeRadio === 0" class="bottom-text">
      请选择类型！
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getJgFeatureAndNum,
  getLineTypeAndNum,
  getLineDiameterAndNum,
  getJgTypeAndNum,
} from "@/services/statistical";
import * as echarts from 'echarts'
import {areaPieOption, typePieOption} from "@/data/echartsData";

const GXToolbar = reactive({
  // 控制类型选择
  typeRadio: 0,
  jgData: {area: [], type: []},
  gxData: {area: [], type: []},
  wifiData: {area: [], type: []},
})

const areaChart = ref(null)
const typeChart = ref(null)

const initData = async () => {
  const jgTypeData = await getJgTypeAndNum()
  const gxTypeData = await getLineTypeAndNum()
  // const wifiData = await getWifiAndNum()

  const jgFeatureData = await getJgFeatureAndNum()
  const gxDiameterData = await getLineDiameterAndNum()
  // const wifiData = await getWifiAndNum()

  // 初始化数据
  GXToolbar.jgData.type = jgTypeData.data.data
  GXToolbar.gxData.type = gxTypeData.data.data

  GXToolbar.jgData.area = jgFeatureData.data.data
  GXToolbar.gxData.area = gxDiameterData.data.data

  let index1 = 0;
  let index2 = 0;
  areaChart.value = echarts.init(document.getElementById('left-container'))
  typeChart.value = echarts.init(document.getElementById('right-container'))
  areaChart.value.setOption(areaPieOption)
  typeChart.value.setOption(typePieOption)
  periodicFun(areaChart.value, index1)
  periodicFun(typeChart.value, index2)
}


// 统计图表动态函数
const periodicFun = (myChart: any, index: number) => {
  const timer = setInterval(() => {
    myChart.dispatchAction({
      type: 'hideTip',
      seriesIndex: 0,
      dataIndex: index
    });
    // 显示提示框
    myChart.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: index
    });
    // 取消高亮指定的数据图形
    myChart.dispatchAction({
      type: 'downplay',
      seriesIndex: 0,
      dataIndex: index == 0 ? 5 : index - 1
    });
    myChart.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: index
    });
    index++;
    if (index > 5) {
      index = 0;
    }
  }, 2000)
}

// 监听查询模式的变化
watch(() => GXToolbar.typeRadio, (val) => {
  // 井盖
  if (val === 1) {
    typePieOption.series[0].data = GXToolbar.jgData.type
    areaPieOption.series[0].data = GXToolbar.jgData.area
    typePieOption.title.text = "井盖类型数量统计"
    areaPieOption.title.text = "井盖特征数量统计"
    areaChart.value.setOption(areaPieOption)
    typeChart.value.setOption(typePieOption)
  }
  // 管线
  else if (val === 2) {
    typePieOption.series[0].data = GXToolbar.gxData.type
    areaPieOption.series[0].data = GXToolbar.gxData.area
    typePieOption.title.text = "管线类型数量统计"
    areaPieOption.title.text = "管线管径数量统计"
    areaChart.value.setOption(areaPieOption)
    typeChart.value.setOption(typePieOption)
  }
  // 附属物
});

onMounted(() => {
  initData()
})
</script>

<style scoped>
@import "@/styles/components/gx-statistic.scss";
</style>
