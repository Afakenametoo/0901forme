import { defineStore } from 'pinia';
import { Ref } from "vue";
import {baseLayer, specialLayer} from '@/data/layerConfig';

export const layerStore = defineStore(
    'layer',
    () => {
        // 图层id
        const currentLayerId: Ref<number> = ref(0);
        // 底图图层选中
        const baseLayer: Ref<any[]> = ref([1, 2]);
        // 管线图层选中
        const specialLayer: Ref<any[]> = ref([]);

        // 设置方法
        const setCurrentLayerId = (val: number) => {
            currentLayerId.value = val;
        };

        const setBaseLayer = (val: any[]) => {
            baseLayer.value = val;
        };

        const setSpecialLayer = (val: any[]) => {
            specialLayer.value = val;
        };

        // 清除方法
        const clearCurrentLayerId = () => {
            currentLayerId.value = -1;
        };

        const clearBaseLayer = () => {
            baseLayer.value = [];
        };

        const clearSpecialLayer = () => {
            specialLayer.value = [];
        };

        // 获取方法
        const getCurrentLayerId = () => currentLayerId.value;

        const getBaseLayer = () => baseLayer.value;

        const getSpecialLayer = () => specialLayer.value;

        return {
            currentLayerId, baseLayer, specialLayer,
            setCurrentLayerId, setBaseLayer, setSpecialLayer,
            clearCurrentLayerId, clearBaseLayer, clearSpecialLayer,
            getCurrentLayerId, getBaseLayer, getSpecialLayer,
            //getSpecialLayerByID
        };
    }
);
