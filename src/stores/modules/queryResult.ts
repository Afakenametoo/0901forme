// store/queryResult.ts
import { defineStore } from 'pinia';

export const useQueryResultStore = defineStore('queryResult', {
  state: () => ({
    WS_POINT: [],
    YS_POINT: [],
    WS_LINE: [],
    YS_LINE: []
  }),
  actions: {
    // 清空 queryResult
    clearQueryResult() {
      this.WS_POINT = [];
      this.YS_POINT = [];
      this.WS_LINE = [];
      this.YS_LINE = [];
    },
    // 更新 queryResult
    updateQueryResult(data: any, source: string) {
      switch (source) {
        case 'WS_POINT':
          this.WS_POINT.push(...data);
          break;
        case 'YS_POINT':
          this.YS_POINT.push(...data);
          break;
        case 'WS_LINE':
          this.WS_LINE.push(...data);
          break;
        case 'YS_LINE':
          this.YS_LINE.push(...data);
          break;
      }
    }
  }
});
