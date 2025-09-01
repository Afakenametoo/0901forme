import * as echarts from 'echarts'

const colorList = ['#63b2ee', '#76da91', '#f8cb7f', '#f89588', '#7cd6cf', '#9192ab', '#7898e1', '#efa666', '#eddd86', '#9987ce', '#63b2ee', '#76da91', '#DC143C', '#DB7093', '#C71585', '#FF00FF', '#9400D3', '#7B68EE', '#FFD700', '#FF4500', '#FFDEAD', '#00FFFF', '#3CB371', '#00FF7F', '#B8860B', '#CD5C5C', '#8B4513', '#CD853F', '#FF0000', '#DB7093', '#FF00FF', '#DA70D6', '#A020F0', '#EECFA1', '#E0EEEE', '#B23AEE', '#CD69C9']


export const pieOption = {
    title: {
        text: '',
        x: 'center',
        y: '38%',
        textStyle: {
            fontSize: 18
        }
    },
    legend: {
        orient: 'center',
        left: 'left'
    },
    toolbox: {
        show: true,
        feature: {
            mark: {show: true},
            dataView: {show: true, readOnly: false, lang: ['数据视图', '关闭', '刷新'], title: '数据统计'},
            // restore: { show: true },
            saveAsImage: {show: true, title: '保存为图片'}
        }
    },
    tooltip: {
        trigger: 'item'
    },
    series: [{
        type: 'pie',
        center: ['50%', '40%'],
        radius: ['44%', '65%'],
        clockwise: true,
        avoidLabelOverlap: true,
        hoverOffset: 15,
        itemStyle: {
            normal: {
                color: (params) => {
                    return colorList[params.dataIndex]
                }
            }
        },
        label: {
            show: true,
            position: 'outside',
            formatter: '{a|{b}：{d}%}\n{hr|}',
            rich: {
                hr: {
                    backgroundColor: 't',
                    borderRadius: 3,
                    width: 3,
                    height: 3,
                    padding: [3, 3, 0, -12]
                },
                a: {
                    padding: [-30, 15, -20, 15]
                }
            }
        },
        labelLine: {
            normal: {
                length: 20,
                length2: 30,
                lineStyle: {
                    width: 1
                }
            }
        },
        data: [],
    }]
};


export const areaPieOption = {
    title: {
        text: '',
        x: '47%',
        y: '38%',
        textStyle: {
            fontSize: 17
        }
    },
    legend: {
        orient: 'vertical',
        left: 'left'
    },
    toolbox: {
        show: true,
        feature: {
            mark: {show: true},
            dataView: {show: true, readOnly: false, lang: ['数据视图', '关闭', '刷新'], title: '数据统计'},
            // restore: { show: true },
            saveAsImage: {show: true, title: '保存为图片'}
        }
    },
    tooltip: {
        trigger: 'item',
    },
    series: [{
        type: 'pie',
        center: ['55%', '40%'],
        radius: ['51%', '72%'],
        clockwise: true,
        avoidLabelOverlap: true,
        hoverOffset: 15,
        itemStyle: {
            normal: {
                color: (params) => {
                    return colorList[params.dataIndex]
                }
            }
        },
        label: {
            show: true,
            position: 'outside',
            formatter: '{a|{b}：{d}%}\n{hr|}',
            rich: {
                hr: {
                    backgroundColor: 't',
                    borderRadius: 3,
                    width: 3,
                    height: 3,
                    padding: [3, 3, 0, -12]
                },
                a: {
                    padding: [-30, 15, -20, 15]
                }
            }
        },
        labelLine: {
            normal: {
                length: 20,
                length2: 30,
                lineStyle: {
                    width: 1
                }
            }
        },
        data: [],
    }]
};

export const typePieOption = {
    title: {
        text: '',
        x: '47%',
        y: '54%',
        textStyle: {
            fontSize: 17
        }
    },
    legend: {
        orient: 'vertical',
        left: 'left'
    },
    toolbox: {
        show: true,
        feature: {
            mark: {show: true},
            dataView: {show: true, readOnly: false, lang: ['数据视图', '关闭', '刷新'], title: '数据统计'},
            // restore: { show: true },
            saveAsImage: {show: true, title: '保存为图片'}
        }
    },
    tooltip: {
        trigger: 'item'
    },
    series: [{
        type: 'pie',
        center: ['55%', '55%'],
        radius: ['51%', '72%'],
        clockwise: true,
        avoidLabelOverlap: true,
        hoverOffset: 15,
        itemStyle: {
            normal: {
                color: (params) => {
                    return colorList[params.dataIndex]
                }
            }
        },
        label: {
            show: true,
            position: 'outside',
            formatter: '{a|{b}：{d}%}\n{hr|}',
            rich: {
                hr: {
                    backgroundColor: 't',
                    borderRadius: 3,
                    width: 3,
                    height: 3,
                    padding: [3, 3, 0, -12]
                },
                a: {
                    padding: [-30, 15, -20, 15]
                }
            }
        },
        labelLine: {
            normal: {
                length: 20,
                length2: 30,
                lineStyle: {
                    width: 1
                }
            }
        },
        data: [],
    }]
}

