import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import {router} from "@/router";
import ElementPlus from "element-plus"
import 'element-plus/dist/index.css'
import pinia from "@/stores";

import { createPinia } from 'pinia';

createApp(App).use(pinia).use(ElementPlus).use(router).use(createPinia()).mount('#app')

