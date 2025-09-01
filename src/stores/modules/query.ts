import {defineStore} from "pinia";
import {Ref} from "vue";

export const queryStore = defineStore(
    'query',
    () => {
        const temp: Ref<boolean> = ref(false)
        //空间查询 id
        const spatialQueryId: Ref<number> = ref(1)
        const canEdit: Ref<boolean> = ref(false)

        // 控制点选框选
        const radio: Ref<number> = ref(0)

        const setRadio = (val: number) => {
            radio.value = val
        }

        const clearRadio = () => {
            radio.value = 0
        }
        
        const setSpatialQueryId = (val: number) => {
            spatialQueryId.value = val
        }

        const setTemp = () => {
            temp.value = true
        }

        const clearTemp = () => {
            temp.value = false
        }

        const clearSpatialQueryId = () => {
            spatialQueryId.value = 1
        }

        return {
            spatialQueryId, temp, radio,
            setSpatialQueryId, setTemp, setRadio,
            clearSpatialQueryId, clearTemp, clearRadio
        }
    }
)
