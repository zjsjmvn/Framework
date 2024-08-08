import { log } from "cc";

export default class TimeUtil {

    /**
     * 将秒数换成时分秒格式
     * @param {number} totalSeconds 
     */
    public static secondsToHour_Minute_Second(totalSeconds: number) {
        let second = Math.floor(totalSeconds),
            minute = 0,
            hour = 0;
        // 如果秒数大于60，将秒数转换成整数
        if (second > 60) {
            // 获取分钟，除以60取整数，得到整数分钟
            minute = Math.floor(second / 60);
            // 获取秒数，秒数取佘，得到整数秒数
            second = Math.floor(second % 60);
            // 如果分钟大于60，将分钟转换成小时
            if (minute > 60) {
                // 获取小时，获取分钟除以60，得到整数小时
                hour = Math.floor(minute / 60);
                // 获取小时后取佘的分，获取分钟除以60取佘的分
                minute = Math.floor(minute % 60);
            }
        }
        // 补位
        hour = ('0' + hour).slice(-2);
        minute = ('0' + minute).slice(-2);
        second = ('0' + second).slice(-2);
        return { hour, minute, second };
    }

    /**
 * 获取两个时间段的秒数
 * @param {string} now 对比的时间
 * @param {string} before 之前的时间
 */
    public static getSecond(now, before) {
        let second = (now.getTime() - before.getTime()) / 1000;
        return Math.floor(second);
    }
    /**
    * 获取两个日期之间的天数
    * @param {Date} now 现在时间
    * @param {Date} before 之前时间
    */
    public static getDays(now, before) {
        return Math.floor((now - before) / 86400000);
    }
    static TimeStamp2Date(timeStamp: number): Date { return new Date(timeStamp * 1000) }
    static Date2TimeStamp(date: Date): number { return Math.floor(date.getTime() / 1000) }
    static getTimeStamp(): number { return Math.floor(new Date().getTime() / 1000) }
    static getMilliTimeStamp(): number { return new Date().getTime() }
    static IsSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }
    static IsSameDayTimeStamp(ts1: number, ts2: number): boolean { return this.IsSameDay(this.TimeStamp2Date(ts1), this.TimeStamp2Date(ts2)) }
    static zeroHourOfTimeStamp(timeStamp: number): number { return this.zeroHourTimeStampOfDate(this.TimeStamp2Date(timeStamp)) }
    static zeroHourTimeStampOfDate(date: Date): number { return this.Date2TimeStamp(date) - (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) }
    static tomorrowTimeStamp(timeStamp: number) { return this.zeroHourOfTimeStamp(timeStamp + 86400) }
    static tomorrowTimeStampOfDate(date: Date): number { return this.tomorrowTimeStamp(this.Date2TimeStamp(date)) }
    static IsToday(timeStamp: number) { return this.IsSameDayTimeStamp(timeStamp, this.getTimeStamp()) }
    static IsBeforToday(timeStamp: number) { return (!this.IsToday(timeStamp)) && timeStamp < this.getTimeStamp() }
    /**
     * 将秒转换的方法，目前格式只支持 dd hh mm ss
     * @param second 秒数
     * @param format 格式
     */
    static Format(seconds: number, format: string = "hh:mm:ss", single: boolean = false) {
        if (format.indexOf('dd') != -1) {
            let d = Math.floor(seconds / 86400)
            seconds = seconds - d * 86400
            let _d = (single || d > 9) ? `${d}` : `0${d}`
            format = format.replace("dd", _d)
        }
        if (format.indexOf('hh') != -1) {
            let h = Math.floor(seconds / 3600)
            seconds = seconds - h * 3600
            let _h = (single || h > 9) ? `${h}` : `0${h}`
            format = format.replace("hh", _h)
        }
        if (format.indexOf('mm') != -1) {
            let m = Math.floor(seconds / 60)
            seconds = seconds - m * 60
            let _m = (single || m > 9) ? `${m}` : `0${m}`
            format = format.replace("mm", _m)
        }
        if (format.indexOf('ss') != -1) {
            let s = Math.floor(seconds)
            let _s = (single || s > 9) ? `${s}` : `0${s}`
            format = format.replace("ss", _s)
        }
        return format
    }

}
