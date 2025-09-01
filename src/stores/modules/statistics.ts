/*
 * @Author: Sleip
 * @Date: 2025-01-10 16:51:11
 * @LastEditors: Sleip
 * @LastEditTime: 2025-01-15 13:33:55
 * @FilePath: \underground_pipelines_display\src\stores\modules\statistics.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by Sleip, All Rights Reserved. 
 */
// stores/stats.ts
import { defineStore } from "pinia";

export const statisticsStore = defineStore("statistics", {
  state: () => ({
    WS_POINT_COUNT: 9593,
    YS_POINT_COUNT: 25594,
    WS_LINE_LENGTH: 260.425,
    YS_LINE_LENGTH: 425.792,
    WIFI_POINT_COUNT: 12345,
  }),
  actions: {
    // 初始化统计数据
    resetStatistics() {
      this.WS_POINT_COUNT = 0;
      this.YS_POINT_COUNT = 0;
      this.WS_LINE_LENGTH = 0.0;
      this.YS_LINE_LENGTH = 0.0;
      this.WIFI_POINT_COUNT = 0;
    },
    incrementPointCount(type: "WS" | "YS") {
      if (type === "WS") this.WS_POINT_COUNT++;
      if (type === "YS") this.YS_POINT_COUNT++;
    },
    addLineLength(type: "WS" | "YS", length: number) {
      if (type === "WS") this.WS_LINE_LENGTH += length;
      if (type === "YS") this.YS_LINE_LENGTH += length;
    },
    setWifiPointCount(count: number) {
      this.WIFI_POINT_COUNT = count;
    },
    incrementWifiPointCount() {
      this.WIFI_POINT_COUNT++;
    },
  },
});
