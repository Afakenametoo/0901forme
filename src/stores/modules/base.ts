import {defineStore} from "pinia";
import {Ref} from "vue";

export const baseStore = defineStore('base', () => {
    const boxMap: Ref<any> = ref(null);
    const popupInfo: Ref<any> = ref({
        infos: null,
        option: null,
        lnglat: null
    })

    const checkedLayers: Ref<any> = ref([])


    const setMapValue = (map: any) => {
        boxMap.value = map
    }

    const setPopupInfo = (infos: any) => {
        popupInfo.value = infos
    }

    const addCheckedLayer = (name: any) => {
        checkedLayers.value.push(name)
    }

    const removeUncheckedLayer = (removeName: any) => {
        let temp = checkedLayers.value.filter(name => {
            if (name != removeName)
                return name
        })
        checkedLayers.value = temp
    }

    return {
        boxMap, popupInfo,checkedLayers,
        setMapValue, setPopupInfo,addCheckedLayer,
        removeUncheckedLayer
    }
})