<template>
  <div class="message-box">
    <div class="item wifipoint">
      <div class="message">
        WiFi点数共计(个)
      </div>
      <div class="num">
        {{ sStore.WIFI_POINT_COUNT.toFixed(0) }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { statisticsStore } from "@/stores";

const sStore = statisticsStore();

onMounted(() => {
  // 可以在这里初始化或请求数据并更新 store
});
</script>

<style scoped>
@font-face {
  font-family: 'YouSheBiaoTiHei';
  src: url('@/styles/font/YouSheBiaoTiHei.ttf') format('truetype');
  font-display: swap;
}

@font-face {
  font-family: 'MSYHBD';
  src: url('@/styles/font/MSYHBD.TTC') format('truetype');
  font-display: swap;
}
.item {
  position: relative;
  background-size: 80%;
  background-position: center;
  background-repeat: no-repeat;
  width: 14.2vw; 
  height: 7vh; 
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: black;
  border-radius: 6px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.message-box {
  position: absolute;
  bottom: 58vh;
  right: 1.2vw;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 2.4vh;
}

.wifipoint {
  background-image: url("@/assets/WIFI.svg");
}

.message {
  margin-top: 5px;
  font-size: 0.8rem;
  font-weight: 300;
  margin-bottom: 2px;
  margin-left: 50px;
  font-family: 'MSYHBD', sans-serif;
}

.num {
  font-size: 1.5rem; 
  font-weight: bold;
  margin-top: -4px;
  margin-left: 48px;
  color: #111; 
  font-family: 'YouSheBiaoTiHei', sans-serif; 
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.4);
}

@media (max-width: 768px) {
  .message-box {
    width: 10vw;
  }

  .item {
    height: 3.5rem;
  }

  .message {
    font-size: 0.7rem;
  }

  .num {
    font-size: 1rem;
  }
}


</style>


