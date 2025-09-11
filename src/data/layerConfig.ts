const tdtToken = 'f23264ec7d30cc186eecde88c70d971f'

const baseLayer = ([
    {
        id: 1,
        label: '矢量底图',
        type: 'image',
        name: 'vec_w',
        url: "/tiles/sl/vec_w/{z}/{y}/{x}.png",
    },
    {
        id: 2,
        label: '矢量注记',
        type: 'image',
        name: 'cva_w',
        url: "/tiles/sl/cva_w/{z}/{y}/{x}.png",

    },
    {
        id: 3,
        label: '影像底图',
        type: 'image',
        name: 'img_w',
        url: "/tiles/yx/img_w/{z}/{x}/{y}.webp",
    },
    {
        id: 4,
        label: '影像注记',
        type: 'image',
        name: 'cia_w',
        url: "/tiles/yx/cia_w/{z}/{y}/{x}.png",
    },
])


const specialLayer = [
    {
      id: 1,
      label: '点状要素',
      showLabel: false, // 默认关闭注记
      children: [
        {
          id: 7, // 新增ID（确保唯一）
          type: 'symbol', // 与井盖一致的点图层类型
          label: 'WiFi信息', // 图层显示名称
          showLabel: false, // 默认关闭注记（与其他点图层一致）
          name: 'WIFI_POINT', // 图层唯一标识（遵循XXX_POINT命名规范）
          url: '/files/geojson/WIFI_POINT.geojson', // 数据源路径（与其他图层统一）
          layout: {
            'icon-image': 'WIFI_ICON', // 引用之前加载的WiFi图标
            'icon-size': 10, // 调整图标大小，使其更小更合适
            'icon-allow-overlap': true, // 允许图标重叠（与其他图层一致）
            'icon-ignore-placement': false
          },
          filter: ["!", ["has", "point_count"]], // 过滤聚合点（与井盖逻辑一致）
          mapping: { // 属性映射（显示在弹窗中的字段，参考井盖的mapping）
            "id": "ID",
            "ssid": "WiFi名称",
            "signalQuality": "信号质量(%)",
            "operator": "运营商"
          },
          // 注记图层配置（与雨水井盖的labelLayer保持一致）
          labelLayer: {
            type: 'symbol',
            name: 'WIFI_POINT_label', // 注记图层名称（主图层名+_label）
            source: 'WIFI_POINT', // 与主图层共享数据源
            layout: {
              'text-field': ['get', 'ssid'], // 注记显示WiFi名称
              'text-size': 12,
              'text-offset': [0, 1],
              'text-anchor': 'top',
              'visibility': 'none' // 默认隐藏
            },
            paint: {
              'text-color': '#000000',
              'text-halo-color': '#ffffff',
              'text-halo-width': 1
            }
        }
        }
      ]
    },
    {
      id: 2,
      label: '线状要素',
      children: [
        // {
        //   id: 5,
        //   label: '雨水管线',
        //   type: 'line',
        //   name: 'YS_LINE',
        //   alias: '管线设置',
        //   data: '/files/geojson/YS_LINE.geojson',
        //   showFlow: false,
        //   layout: {
        //     'line-join': 'round',
        //     'line-cap': 'round'
        //   },
        //   style: {
        //     'line-color': '#0000ff',
        //     'line-width': [
        //       "step",
        //       ["zoom"],
        //       1,
        //       10,
        //       1,
        //       11,
        //       1.5,
        //       13,
        //       2,
        //       16,
        //       2.5,
        //       17,
        //       3,
        //       18,
        //       4
        //     ],
        //   },
        //   mapping: {
        //     "ObjectID": "ID",
        //     "GC": "管材",
        //     "GJ": "管径",
        //     "Shape_Leng": "长度",
        //     "SSWZ": "设施位置"
        //   }
        // },
        // {
        //   id: 6,
        //   label: '污水管线',
        //   type: 'line',
        //   name: 'WS_LINE',
        //   alias: '管线设置',
        //   data: '/files/geojson/WS_LINE.geojson',
        //   showFlow: false,
        //   layout: {
        //     'line-join': 'round',
        //     'line-cap': 'round'
        //   },
        //   style: {
        //     'line-color': '#fe5708',
        //     'line-width': [
        //       "step",
        //       ["zoom"],
        //       1,
        //       10,
        //       1,
        //       11,
        //       1.5,
        //       13,
        //       2,
        //       16,
        //       2.5,
        //       17,
        //       3,
        //       18,
        //       4
        //     ],
        //   },
        //   mapping: {
        //     "ObjectID": "ID",
        //     "GC": "管材",
        //     "GJ": "管径",
        //     "Shape_Leng": "长度",
        //     "SSWZ": "设施位置"
        //   }
        // }
      ]
    }
  ];

/**
 * @description: 据querypanel的图层名称、source图层、相关字段等信息，填充图层标注属性
 * @param {string} sourceLayer
 * @param {any} fields
 * @return {*}
 */
const baseLabel = (sourceLayer: string, fields: any[], visibility: string) => {
    let textFiled: any = ["format"];
    fields.forEach((field, idx) => {
        if (fields.length === 1) textFiled.push(["get", field]);
        else if (idx === fields.length - 1)
            textFiled.push(["get", field], { "font-scale": 0.8 });
        else textFiled.push(["get", field], "\n", {});
    });
    return {
        source: sourceLayer,
        type: "symbol",
        style: {
            "text-color": "#000",
            'text-halo-color': '#FFF',
            'text-halo-width': 1
        },
        layout: {
            "text-field": textFiled,
            "text-font": ["Open Sans Regular,Arial Unicode MS Regular"],
            "text-size": 14,
            "text-allow-overlap": false,
            "text-ignore-placement": false,
            "text-anchor": "center",
            "text-justify": "center",
            "visibility": visibility
        },
    };
};



export {
    baseLayer, specialLayer, baseLabel
}