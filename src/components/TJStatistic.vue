<!--
* @Author: lihua
* @Description: 条件统计
* @time:
-->

<template>
  <div class="tj-container">
    <!--    table-->
    <div class="top-container">
      <div class="select-box">
        <div class="title">类型选择</div>
        <div class="content">
          <el-radio-group
              v-model="TJToolbar.typeRadio"
          >
            <el-radio :value="1">WIFI</el-radio>
            <!-- <el-radio :value="2">管线</el-radio> -->
          </el-radio-group>
        </div>
      </div>
      <div class="select-box">
        <div class="title">图层选择</div>
        <el-checkbox
            :indeterminate="TJToolbar.layerIndeterminate"
            v-model="TJToolbar.layerCheckAll"
            @change="TJToolbar.handleCheckAllLayersChange"
        >全选
        </el-checkbox>
        <el-checkbox-group
            v-model="TJToolbar.checkedLayers"
            @change="TJToolbar.handleCheckedLayersChange"
            style="margin-left: 1vw"
        >
          <el-checkbox
              v-for="layer in TJToolbar.layers"
              :value="layer"
              :key="layer"
          >{{ layer }}
          </el-checkbox>
        </el-checkbox-group>
      </div>


      <div class="select-box">
        <div class="title">街道选择</div>
        <el-select class="select-street" v-model="TJToolbar.checkedStreet"
                   clearable filterable multiple collapse-tags
                   placeholder="请选择">
          <el-option
              v-for="item in TJToolbar.street"
              :key="item"
              :label="item"
              :value="item"
              :disabled=TJToolbar.disableOptions.includes(item)>
          </el-option>
        </el-select>
      </div>
      <div class="select-box" v-show="TJToolbar.typeRadio != 3">
        <div class="title">材质选择</div>
        <el-checkbox
            :indeterminate="TJToolbar.typeIndeterminate"
            v-model="TJToolbar.typeCheckAll"
            @change="TJToolbar.handleCheckAllTypesChange"
        >全选
        </el-checkbox>
        <el-checkbox-group
            v-model="TJToolbar.checkedTypes"
            @change="TJToolbar.handleCheckedTypesChange"
            style="margin-left: 1vw"
        >
          <el-checkbox
              v-for="type in TJToolbar.types"
              :value="type"
              :key="type"
          >{{ type }}
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <!-- <div class="select-box" v-show="TJToolbar.typeRadio === 1">
      <div class="title">地面高程选择</div>
      <el-checkbox
          :indeterminate="TJToolbar.rangeIndeterminate"
          v-model="TJToolbar.rangeCheckAll"
          @change="TJToolbar.handleCheckAllRangeChange"
      >全选
      </el-checkbox>
      <el-checkbox-group
          v-model="TJToolbar.checkedRanges"
          @change="TJToolbar.handleCheckedRangesChange"
          style="margin-left: 1vw"
      >
        <el-checkbox
            v-for="type in range"
            :value="type"
            :key="type"
        >{{ type }}
        </el-checkbox>
      </el-checkbox-group>
    </div> -->
      <!-- <div class="select-box" v-show="TJToolbar.typeRadio === 1">
        <div class="title">特征选择</div>
        <el-checkbox
            :indeterminate="TJToolbar.featureIndeterminate"
            v-model="TJToolbar.featureCheckAll"
            @change="TJToolbar.handleCheckAllFeatureChange"
        >全选
        </el-checkbox>
        <el-checkbox-group
            v-model="TJToolbar.checkedFeature"
            @change="TJToolbar.handleCheckedFeatureChange"
            style="margin-left: 1vw"
        >
          <el-checkbox
              v-for="type in TJToolbar.feature"
              :value="type"
              :key="type"
          >{{ type }}
          </el-checkbox>
        </el-checkbox-group>
      </div> -->
      <el-divider><i class="el-icon-arrow-up"></i></el-divider>
    </div>
    <!--    echarts-->
    <div v-show="TJToolbar.typeRadio !== 0" class="bottom-container" id="bottom-container">
    </div>
    <div v-show="TJToolbar.typeRadio !== 0" class="statistical-info">
      {{ message }}<span style="color: red">{{ outcome }}</span>
    </div>
    <div v-show="TJToolbar.typeRadio === 0" class="bottom-text">
      请选择类型！
    </div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import {pieOption} from "@/data/echartsData";
import {
  getEchartsData,
  getLineType,
  getPointType, getPointFeature, listStreet
} from "@/services/statistical";
import {queryData, streetQueryData} from "@/types/echarts";
// 展示结果文字
const message = ref('')
// 展示结果数量
const outcome = ref('')
const pieChart = ref(null)
const range = ["0-30", "30-40", "40-50", "50-70", "70-90", "大于90", "未知"]
const TJToolbar = reactive({
  typeRadio: 0,
  disableOptions: ref([]),
  // 图层（雨水污水） 全选控制
  layerIndeterminate: false,
  layerCheckAll: true,
  layers: ['雨水', '污水','WIFI'],
  checkedLayers: ['雨水', '污水','WIFI'],
  // 材质 全选控制
  typeIndeterminate: false,
  typeCheckAll: true,
  checkedTypes: [],
  types: [],
  pointType: [],
  lineType: [],
  // 高程范围 全选控制
  rangeIndeterminate: false,
  rangeCheckAll: true,
  checkedRanges: [],
  ranges: [],
  // 特征 全选控制
  featureIndeterminate: false,
  featureCheckAll: true,
  checkedFeature: [],
  feature: [],
  pointFeature: [],
  // 街道
  checkedStreet: ["全部"],
  street: [],

  // 图层选择控制函数
  handleCheckAllLayersChange: (val) => {
    TJToolbar.checkedLayers = val ? TJToolbar.layers : [];
    TJToolbar.layerIndeterminate = false;
  },
  handleCheckedLayersChange: (val) => {
    let checkedCount = val.length
    TJToolbar.layerCheckAll = checkedCount === TJToolbar.layers.length
    TJToolbar.layerIndeterminate = checkedCount > 0 && checkedCount < TJToolbar.layers.length
  },
  // 材质选择控制函数
  handleCheckAllTypesChange: (val) => {
    TJToolbar.checkedTypes = val ? TJToolbar.types : [];
    TJToolbar.typeIndeterminate = false;
  },
  handleCheckedTypesChange: (val) => {
    let checkedCount = val.length
    TJToolbar.typeCheckAll = checkedCount === TJToolbar.types.length
    TJToolbar.typeIndeterminate = checkedCount > 0 && checkedCount < TJToolbar.types.length
  },
  // 地面高程选择控制函数
  handleCheckAllRangeChange: (val) => {
    TJToolbar.checkedRanges = val ? range : [];
    TJToolbar.rangeIndeterminate = false;
  },
  handleCheckedRangesChange: (val) => {
    let checkedCount = val.length
    TJToolbar.rangeCheckAll = checkedCount === range.length
    TJToolbar.rangeIndeterminate = checkedCount > 0 && checkedCount < range.length
  },
  // 特征选择控制函数
  handleCheckAllFeatureChange: (val) => {
    TJToolbar.checkedFeature = val ? TJToolbar.feature : [];
    TJToolbar.featureIndeterminate = false;
  },
  handleCheckedFeatureChange: (val) => {
    let checkedCount = val.length
    TJToolbar.featureCheckAll = checkedCount === TJToolbar.feature.length
    TJToolbar.featureIndeterminate = checkedCount > 0 && checkedCount < TJToolbar.feature.length
  }
})


// 统计图表初始化
const initChart = () => {
  let index = 0;
  pieChart.value = echarts.init(document.getElementById('bottom-container'))
  pieChart.value.setOption(pieOption)
  periodicFun(pieChart.value, index)
}

// 统计图表动态函数
const periodicFun = (myChart: any, index: number) => {
  setInterval(() => {
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


const initData = async () => {
  TJToolbar.pointType = (await getPointType()).data.data
  TJToolbar.lineType = (await getLineType()).data.data
  TJToolbar.pointFeature = (await getPointFeature()).data.data
}


// 监听类型选择变化
watch(() => TJToolbar.typeRadio, async (val) => {
  const tempData = generateStreetQuery()
  TJToolbar.street = (await listStreet(tempData)).data.data
  generateDisableOptions()
  // 井盖
  if (val === 1) {
    TJToolbar.types = TJToolbar.pointType
    TJToolbar.feature = TJToolbar.pointFeature
    TJToolbar.checkedTypes = TJToolbar.pointType
    TJToolbar.checkedFeature = TJToolbar.pointFeature
    TJToolbar.ranges = range
    TJToolbar.checkedRanges = range
    pieOption.title.text = '井盖数量统计'
  }
  // 管线
  else if (val === 2) {
    TJToolbar.types = TJToolbar.lineType
    TJToolbar.checkedTypes = TJToolbar.lineType
    pieOption.title.text = '管线数量统计'
  }
})

const generateDisableOptions = () => {
  if (TJToolbar.checkedStreet.length > 0 && TJToolbar.checkedStreet[0] === "全部") {
    TJToolbar.street.forEach(street => {
      if(street != "全部") {
        TJToolbar.disableOptions.push(street)
      }
    })
    console.log("TJToolbar.disableOptions", TJToolbar.disableOptions)
  } else if(!TJToolbar.checkedStreet.includes("全部")){
    TJToolbar.disableOptions.push("全部")
  }
  if(TJToolbar.checkedStreet.length === 0){
    console.log("TJToolbar.checkedStreet.length", TJToolbar.checkedStreet.length)
    while (TJToolbar.disableOptions.length) {
      TJToolbar.disableOptions.pop()
    }
  }
}

const generateStreetQuery = (): streetQueryData => {
  const streetData: streetQueryData = {
    type: [],
    flag: true,
  }
  streetData.type = toRaw(TJToolbar.checkedLayers)
  if (TJToolbar.typeRadio === 1) {
    streetData.type.forEach((item) => {
      item.concat("井盖")
    })
  } else if (TJToolbar.typeRadio === 2) {
    streetData.type.forEach((item) => {
      item.concat("管线")
    })
  }
  return streetData
}

watch(() => TJToolbar.typeRadio, async () => {
  TJToolbar.checkedStreet = ["全部"]
})

watch(() => [TJToolbar.checkedStreet], async () => {
  generateDisableOptions()
})

// 监听图层选择变换
watch(() => [TJToolbar.checkedLayers, TJToolbar.checkedStreet,TJToolbar.checkedTypes,TJToolbar.checkedRanges,TJToolbar.typeRadio,TJToolbar.checkedFeature], async () => {
  const tempData = generateData()
  const res = (await getEchartsData(tempData)).data.data
  pieOption.series[0].data = res.list
  if (TJToolbar.typeRadio === 1) {
    message.value = "窖井总数："
    outcome.value = (res?.num === null ? 0 : res?.num) + "个"
  }
  if (TJToolbar.typeRadio === 2) {
    message.value = "管线设施（线）总长："
    outcome.value = (res?.length === null ? 0 : res?.length) + "米"
  }
  pieChart.value.setOption(pieOption)
})


const generateData = (): queryData => {
  const echartsData: queryData = {
    type: '',
    texture: [],
    street: [],
    range: [],
    feature: [],
    layer: []
  }

  // 类型数据
  echartsData.type = TJToolbar.typeRadio === 1 ? 'JG' : TJToolbar.typeRadio === 2 ? 'GX' : '';
  // 图层数据
  const tmp = []
  if (TJToolbar.checkedLayers.includes('污水')) {
    tmp.push('WS')
  }
  if (TJToolbar.checkedLayers.includes('雨水')) {
    tmp.push('YS')
  }
  echartsData.layer = tmp
  // 街道数据
  echartsData.street = toRaw(TJToolbar.checkedStreet)
  // 材质数据
  echartsData.texture = toRaw(TJToolbar.checkedTypes)
  // 特征数据
  echartsData.feature = toRaw(TJToolbar.checkedFeature)
  // 高程范围数据
  echartsData.range = toRaw(TJToolbar.checkedRanges)


  return echartsData
}

onMounted(() => {
  initChart()
  initData()
})
</script>

<style scoped>
@import '@/styles/components/tj-statistic.scss';

.select-street {
  width: 200px;
  height: 35px;
}
</style>
