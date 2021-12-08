/**
 * 数值格式化函数, 通过语义解析自动设置值的范围
 *     //整数
 * 1:def(0)//显示一个默认值
 */
class StringFormat {
    deal(value: number | string, format: string): string {
        if (format === '') return value as string;
        format = format.toLowerCase().trim();//不区分大小
        let match_func = format.match(/^[a-z|A-Z]+/gi);//匹配到 format 中的 函数名
        let match_num = format.match(/\d+$/gi);   //匹配到 format 中的参数
        let func: string = '';
        let num: number;
        let res: number | string = '';



        if (match_func) func = match_func[0];
        if (match_num) num = parseInt(match_num[0]);

        if (typeof value == 'number') {
            switch (func) {
                case 'int': res = this.int(value); break;
                case 'floorint': res = this.floorInt(value); break;
                case 'ceilint': res = this.ceilInt(value); break;
                case 'fix': res = this.fix(value, num); break;
                case 'kmbt': res = this.KMBT(value); break;
                case 'per': res = this.per(value, num); break;
                case 'sep': res = this.sep(value); break;
                case 'timehms': res = this.time_h_m_s(value); break;
                default:
                    break;
            }

        } else {
            switch (func) {
                case 'limit': res = this.limit(value, num); break;

                default:
                    break;
            }
            res = value;
        }

        return res as string;


    }

    //将数字按分号显示
    private sep(value: number) {
        let num = Math.round(value).toString();
        return num.replace(new RegExp('(\\d)(?=(\\d{3})+$)', 'ig'), "$1,");
    }
    private floorInt(value: number) {
        return Math.floor(value);
    }
    private ceilInt(value: number) {
        return Math.ceil(value);
    }

    //将数字按分显示 00:00 显示 （ms制）
    private time_m(value: number) {
        //todo
    }

    //将数字按秒显示 00:00:00 显示 （ms制）
    private time_s(value: number) {
        //todo
    }

    //将数字按 0:00:00:000 显示 （ms制）
    private time_ms(value: number) {
        //todo
    }


    /**
     * @description 将秒转换为时分秒
     * @private
     * @param {number} seconds
     * @memberof StringFormat
     */
    private time_h_m_s(seconds: number) {
        let totalSeconds = Math.floor(seconds),
            minute = 0,
            hour = 0;
        // 如果秒数大于60，将秒数转换成整数
        if (totalSeconds > 60) {
            // 获取分钟，除以60取整数，得到整数分钟
            minute = Math.floor(totalSeconds / 60);
            // 获取秒数，秒数取佘，得到整数秒数
            totalSeconds = Math.floor(totalSeconds % 60);
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
        totalSeconds = ('0' + totalSeconds).slice(-2);
        return hour + ':' + minute + ":" + totalSeconds;
    }

    //将时间戳显示为详细的内容
    private timeStamp(value: number) {
        //todo
        return new Date(value).toString()
    }

    /** [value:int] 将取值0~1 变成 1~100,可以指定修饰的小数位数 */
    private per(value: number, fd: number) {
        return Math.round(value * 100).toFixed(fd);
    }

    /** [value:int] 将取值变成整数 */
    private int(value: number) {
        return Math.round(value);
    }

    /** [value:fix2]数值转换为小数*/
    private fix(value: number, fd: number) {
        return value.toFixed(fd)
    }

    /** [value:limit3]字符串长度限制 */
    private limit(value: string, count: number) {
        return value.substring(0, count);
    }

    /** 将数字缩短显示为KMBT单位 大写,目前只支持英文 */
    private KMBT(value: number, lang: string = 'en') {
        //10^4=万, 10^8=亿,10^12=兆,10^16=京，
        let counts = [1000, 1000000, 1000000000, 1000000000000];
        let units = ['', 'K', 'M', 'B', 'T'];

        switch (lang) {
            case 'zh':
                //10^4=万, 10^8=亿,10^12=兆,10^16=京，
                let counts = [10000, 100000000, 1000000000000, 10000000000000000];
                let units = ['', '万', '亿', '兆', '京'];
                break;

            default:
                break;
        }

        return this.compressUnit(value, counts, units, 2);
    }


    //压缩任意单位的数字，后缀加上单位文字
    private compressUnit(value, valueArr: number[], unitArr: string[], fixNum: number = 2): string {
        let counts = valueArr;
        let units = unitArr;
        let res: string;
        let index;
        for (index = 0; index < counts.length; index++) {
            const e = counts[index];
            if (value < e) {
                if (index > 0) {
                    res = (value / counts[index - 1]).toFixed(fixNum);
                } else {
                    res = value.toFixed(0);
                }
                break;
            }

        }
        return res + units[index];
    }



}

/**格式化处理函数 */
export let StringFormatFunction = new StringFormat();

// cc.log(StringFormatFunction.deal('2.1111', 'fix2'));

// function parseTemplate(originText) {
//     let regexAll = /\{\{(.+?)\}\}/g; //匹配： 所有的{{value}}
//     let regex = /\{\{(.+?)\}\}/;//匹配： {{value}} 中的 value
//     let res = originText.match(regexAll);//匹配结果数组
//     if (!!!res) return;
//     for (let i = 0; i < res.length; i++) {
//         const e = res[i];
//         let arr = e.match(regex);
//         let matchName = arr[1];
//         let matchNameSplit = matchName.split(':');
//         cc.log('matchNameSplit', matchNameSplit)
//         let matchInfo = matchNameSplit[1] || '';
//         let valueIndex = matchNameSplit[0];
//         this.replaceStrArr[i] = e;
//         this.valueIndexArr[i] = parseInt(valueIndex || '0') || 0;
//         this.templateFormatArr[i] = matchInfo;
//     }
// }

// parseTemplate("{{0:int}}")
