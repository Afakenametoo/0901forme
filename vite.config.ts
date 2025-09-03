/*
 * @Author: lily 784710791@qq.com
 * @Date: 2024-12-02 11:23:06
 * @LastEditTime: 2025-02-19 15:02:11
 * @LastEditors: lily 784710791@qq.com
 * @Description: 描述
 */
import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from "@vitejs/plugin-legacy"
import vueJsx from "@vitejs/plugin-vue-jsx";
// 自动依赖导入插件
import AutoImport from "unplugin-auto-import/vite";
import {VantResolver} from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
// @ts-ignore
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({command, mode}) => {
    const config = loadEnv(mode, './')
    return {
        base: "./",
        plugins: [vue(),
            AutoImport({
                imports: ["vue", "vue-router"],
                dts: "src/auto-import.d.ts",
            }),
            vueJsx({
                transformOn: true,
                mergeProps: true,
            }),
            legacy({
                targets: ['defaults', 'not IE 11']
            }),
            Components({
                resolvers: [VantResolver()],
            }),
        ],
        resolve: {
            // 配置路径别名
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        build: {
            minify: "terser",
            assetsInlineLimit: 1024,
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler'
                }
            }
        },
        server: {
            host: '0.0.0.0',
            port: 8185,
            hmr: true,
            open: false,
            cors: true,
            proxy: {
                '/underground': {
                    target: config.VITE_BACK,
                    changeOrigin: true,
                },
                '/fonts': {
                    target: config.VITE_NGINX,
                    changeOrigin: true
                },
                /* '/files': {
                    target: config.VITE_NGINX,
                    changeOrigin: true
                }, */
                '/tiles': {
                    target: config.VITE_NGINX,
                    changeOrigin: true
                }
            }
        }
    }
})