import { log } from "cc";

/** 字符串工具 */
export class StringUtil {
    /** 获取一个唯一标识的字符串 */
    static guid() {
        let guid: string = "";
        for (let i = 1; i <= 32; i++) {
            let n = Math.floor(Math.random() * 16.0).toString(16);
            guid += n;
            if ((i == 8) || (i == 12) || (i == 16) || (i == 20))
                guid += "-";
        }
        return guid;
    }

    /**
     * 转美式计数字符串
     * @param value 数字
     * @example
     * 123456789 = 123,456,789
     */
    static numberTotPermil(value: number): string {
        return value.toLocaleString();
    }

    /** 
     * 转英文单位计数
     * @param value 数字
     * @param fixed 保留小数位数
     * @example
     * 12345 = 12.35K
     */
    static numberToThousand(value: number, fixed: number = 2): string {
        var k = 1000;
        var sizes = ['', 'K', 'M', 'G'];
        if (value < k) {
            return value.toString();
        }
        else {
            var i = Math.floor(Math.log(value) / Math.log(k));
            var r = ((value / Math.pow(k, i)));
            return r.toFixed(fixed) + sizes[i];
        }
    }

    /** 
     * 转中文单位计数
     * @param value 数字
     * @param fixed 保留小数位数
     * @example
     * 12345 = 1.23万
     */
    static numberToTenThousand(value: number, fixed: number = 2): string {
        var k = 10000;
        var sizes = ['', '万', '亿', '万亿'];
        if (value < k) {
            return value.toString();
        }
        else {
            var i = Math.floor(Math.log(value) / Math.log(k));
            return ((value / Math.pow(k, i))).toFixed(fixed) + sizes[i];
        }
    }

    /**
     * 时间格式化
     * @param date  时间对象
     * @param fmt   格式化字符(yyyy-MM-dd hh:mm:ss S)
     */
    static format(date: Date, fmt: string) {
        var o: any = {
            "M+": date.getMonth() + 1,                   // 月份 
            "d+": date.getDate(),                        // 日 
            "h+": date.getHours(),                       // 小时 
            "m+": date.getMinutes(),                     // 分 
            "s+": date.getSeconds(),                     // 秒 
            "q+": Math.floor((date.getMonth() + 3) / 3), // 季度 
            "S": date.getMilliseconds()                  // 毫秒 
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    }

    /**
     * "," 分割字符串成数组
     * @param str 字符串
     */
    static stringToArray1(str: string) {
        if (str == "") {
            return [];
        }
        return str.split(",");
    }

    /** 
     * "|" 分割字符串成数组 
     * @param str 字符串
     */
    static stringToArray2(str: string) {
        if (str == "") {
            return [];
        }
        return str.split("|");
    }

    /** 
     * ":" 分割字符串成数组
     * @param str 字符串
     */
    static stringToArray3(str: string) {
        if (str == "") {
            return [];
        }
        return str.split(":");
    }

    /** 
     * ";" 分割字符串成数组 
     * @param str 字符串
     */
    static stringToArray4(str: string) {
        if (str == "") {
            return [];
        }
        return str.split(";");
    }

    /**
     * 字符串截取
     * @param str     字符串
     * @param n       截取长度
     * @param showdot 是否把截取的部分用省略号代替
     */
    static sub(str: string, n: number, showdot: boolean = false) {
        var r = /[^\x00-\xff]/g;
        if (str.replace(r, "mm").length <= n) { return str; }
        var m = Math.floor(n / 2);
        for (var i = m; i < str.length; i++) {
            if (str.substr(0, i).replace(r, "mm").length >= n) {
                if (showdot) {
                    return str.substr(0, i) + "...";
                } else {
                    return str.substr(0, i);
                }
            }
        }
        return str;
    }

    /**
     * 计算字符串长度，中文算两个字节
     * @param str 字符串
     */
    static stringLen(str: string) {
        var realLength = 0, len = str.length, charCode = -1;
        for (var i = 0; i < len; i++) {
            charCode = str.charCodeAt(i);
            if (charCode >= 0 && charCode <= 128)
                realLength += 1;
            else
                realLength += 2;
        }
        return realLength;
    }
    public static formatSuffix(num: string, fixedCount = 2) {
        let special = 'km';
        let strArr = 'abcdefghijlnopqrstuvwxyz';
        num = num.split('.')[0];
        let length = num.length - 1;
        let indexOf1000 = 0;
        while (length >= 3) {
            length -= 3;
            indexOf1000++;
        }
        let str = num.slice(0, length + 1);
        let str2 = num.slice(length + 1, length + fixedCount + 1);
        // log('str2', str2)
        if (num.length >= 3) {

        }

        if (str2 != '') {


            let str2EndIndex = str2.length - 1;
            let get0 = false;
            let strNeedAdd = '';
            //找到第一个不为0的位置
            while (str2EndIndex) {
                if (str2[str2EndIndex] != '0') {
                    break;
                } else {
                    str2EndIndex--;
                }
            }
            str += '.' + str2.slice(0, str2EndIndex + 1);
        }
        // log('length', length, num.slice(0, length + 1));
        if (indexOf1000 <= 3) {
            if (indexOf1000 < 1) {
                return str += '';
            } else if (indexOf1000 >= 1 && indexOf1000 < 2) {
                return str += special[0];
            } else if (indexOf1000 >= 2 && indexOf1000 < 3) {
                return str += special[1];
            }
        }
        indexOf1000 -= 2;
        // log('-------------------')
        //index表示全排列index个字母。通过 Math.pow(strArr.length, index)就能算出这个index有多少数量。
        /**
         * 
         * 如index=2，表示：
         * aa,ab,ac,ad,ae,af,ag,ah,ai,......az;
         * ba,bb,bc,bd,be...................bz;
         * .
         * .
         * .
         * za...............................zz;
         * 以上，Math.pow(strArr.length, index) 就是全排列2个字母共多少数量。
         */
        let leftCount = indexOf1000;
        let index = 1;
        // 计算属于哪一个index.和count。count代表的是哪个index的行。
        while (1) {
            // 等于的情况
            let indexCount = Math.pow(strArr.length, index);
            if (leftCount > indexCount) {
                index++;
                leftCount -= indexCount;
            } else {
                break;
            }
        }
        //现在算出来了index,index就是全排列几个字母，还有剩余的count；
        // 算出一共多少行。
        let columnCount = Math.ceil(leftCount / strArr.length);// left = 1, index= 2
        // 算出在哪一列
        let row = indexOf1000 % strArr.length;
        if (row == 0) {
            row = strArr.length;
        }
        // log(index, columnCount)
        while (index > 1) {
            let c = Math.pow(strArr.length, index - 2);
            let ss = Math.ceil(columnCount / c);

            if (ss > strArr.length) {
                ss = ss % strArr.length;
                if (ss == 0) {
                    ss = strArr.length;
                }
            }
            // columnCount -= c;
            // log('ss', ss, c, columnCount);
            str += strArr[ss - 1];
            index--;
        }
        str += strArr[row - 1];
        // log('row', row);
        return str;
    }
}


