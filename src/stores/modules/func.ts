// stores/boxSelect.ts
import { defineStore } from 'pinia';

export const useBoxSelectStore = defineStore('boxSelect', {
    state: () => ({
        removeBoxSelectFn: null as (() => void) | null,
    }),
    actions: {
        setRemoveBoxSelectFn(fn: () => void) {
            this.removeBoxSelectFn = fn;
        },
        clearBoxSelect() {
            if (this.removeBoxSelectFn) {
                this.removeBoxSelectFn();
                this.removeBoxSelectFn = null;
            }
        },
    },
});