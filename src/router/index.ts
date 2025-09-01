import {createRouter, RouteRecordRaw, createWebHashHistory} from "vue-router";

const routes: Readonly<RouteRecordRaw[]> = [
    {
        path: '/',
        redirect: '/map'
    }, {
        path: '/map',
        component: () => import('../pages/Map.vue')
    }
]

const options = {
    history: createWebHashHistory(),
    routes: routes,
}
export const router = createRouter(options)
