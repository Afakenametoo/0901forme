/**
 * 日期格式化
 * @param date 日期对象
 * @param format 日期格式，默认为 YYYY-MM-DD HH:mm:ss
 * */
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD HH:mm:ss') => {
    // 获取年月日时分秒， 通过 padStart 补 0·
    const year: string = String(date.getFullYear())
    const month: string = String(date.getMonth() + 1).padStart(2, '0')
    const day: string = String(date.getDate()).padStart(2, '0')
    const hours: string = String(date.getHours()).padStart(2, '0')
    const minutes: string = String(date.getMinutes()).padStart(2, '0')
    const seconds: string = String(date.getSeconds()).padStart(2, '0')

    // 返回格式化后的结果
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
}
