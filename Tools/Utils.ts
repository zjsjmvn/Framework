import { Widget } from '../../../../creator';

export default class Utils {
    constructor() { }

    /** 长震动 */
    public static vibrateLong() {
        // if ('vibrate' in window.navigator) {
        //     window.navigator.vibrate(400);
        // } else if (window['wx'] && wx.vibrateLong) {
        //     wx.vibrateLong();
        // }
    }

    /** 短震动 */
    public static vibrateShort() {
        // if ('vibrate' in window.navigator) {
        //     window.navigator.vibrate(15);
        // } else if (window['wx'] && wx.vibrateShort) {
        //     wx.vibrateShort();
        // }
    }

    /**
     * 时间戳生成
     * @param {number} num 1为明天，0为今天，-1为昨天，以此类推
     * 
    */
    public static timeFormat(num = 0) {
        let date, month, day, hour, minute, second, time;
        date = new Date(new Date().getTime() + (num * 24 * 3600 * 1000));
        month = ('0' + (date.getMonth() + 1)).slice(-2);
        day = ('0' + date.getDate()).slice(-2);
        hour = ('0' + date.getHours()).slice(-2);
        minute = ('0' + date.getMinutes()).slice(-2);
        second = ('0' + date.getSeconds()).slice(-2);
        time = `${date.getFullYear()}/${month}/${day} ${hour}:${minute}:${second}`;
        return time;
    }

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

    /**
     * 过滤掉特殊符号
     * @param {string} str 
     */
    public static filterStr(str) {
        let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？%+_]");
        let newStr = '';
        for (let i = 0; i < str.length; i++) {
            newStr += str.substr(i, 1).replace(pattern, '');
        }
        return newStr;
    }

    /**
     * 带单位的数值转换
     * @param {number} value 数字
     */
    public static unitsNumber(value) {
        // 取整
        value = Math.floor(value);
        if (value == 0) return 0;
        /** 单位 */
        let units = ['', 'k', 'm', 'b', 'f', 'e', 'ae', 'be', 'ce', 'de', 'ee', 'fe', 'ge', 'he', 'ie'];
        /** 索引 */
        let index = Math.floor(Math.log(value) / Math.log(1000));
        /** 结果 */
        let result = value / Math.pow(1000, index);
        if (index === 0) return result;
        result = result.toFixed(3);
        // 不进行四舍五入 取小数点后一位
        result = result.substring(0, result.lastIndexOf('.') + 2);
        return result + units[index];
    }

    /**
     * 范围随机数 [min,max] 返回整数
     * @param {number} min 最小数
     * @param {number} max 最大数
     */
    public static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    /**
     * 范围随机数 (min,max) ,返回浮点数
     * @param {number} min 最小数
     * @param {number} max 最大数
     */
    public static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    /**
     * 数组中随机取几个元素
     * @param {array} arr 数组
     * @param {number} count 元素个数
     */
    public static getRandomArrayElements(array, count) {
        /** 数组长度 */
        let length = array.length;
        /** 最小长度 */
        let min = length - count, temp, range;
        while (length-- > min) {
            range = Math.floor((length + 1) * Math.random());
            temp = array[range];
            array[range] = array[length];
            array[length] = temp;
        }
        return array.slice(min);
    }

    /**
     * 随机打乱数组
     * @param {array} array
     */
    public static shuffleArray(array: Array<any>) {
        let random = (a, b) => Math.random() > 0.5 ? -1 : 1;
        return array.sort(random);
    }

    /**
     * 将指定位置的元素置顶
     * @param {array} array 改数组
     * @param {number} index 元素索引
     */
    public static zIndexToTop(array, index) {
        if (index != 0) {
            let item = array[index];
            array.splice(index, 1);
            array.unshift(item);
        } else {
            console.log('已经处于置顶');
        }
    }

    /**
     * 将指定位置的元素置底
     * @param {array} array 改数组
     * @param {number} index 元素索引
     */
    public static zIndexToBottom(array, index) {
        if (index != array.length - 1) {
            let item = array[index];
            array.splice(index, 1);
            array.push(item);
        } else {
            console.log('已经处于置底');
        }
    }

    // cocos creator >> utils =======================================================

    /**
     * 返回旋转角度 旋转的节点坐标必须为(0, 0)才可以 所以要相对应的进行转换
     * @param {number} x 点击的坐标位置 x
     * @param {number} y 点击的坐标位置 y
     */
    public static rotateAngle(x, y) {
        if (y === 0) {
            if (x > 0) {
                return 90;
            }
            else if (x < 0) {
                return 270;
            }
            return 0;
        }
        if (x === 0) {
            if (y > 0) {
                return 0;
            }
            else {
                return 180;
            }
        }

        let rate = Math.atan(Math.abs(x) / Math.abs(y));
        if (x > 0 && y > 0) {
            return 360 - 180 * rate / Math.PI;
        }
        else if (x > 0 && y < 0) {
            return 180 + 180 * rate / Math.PI;
        }
        else if (x < 0 && y < 0) {
            return 180 - 180 * rate / Math.PI;
        }
        else if (x < 0 && y > 0) {
            return 180 * rate / Math.PI;
        }
    }

    /** 加载框 */
    loading_box = null;
    /** 加载进度文字 */
    loading_text = null;

    /**
     * 定义加载框 在当前场景初始化的时候执行一次
     * @param {cc.Node} node 加载框节点
     * @param {cc.Node} scene 加载框 输出的场景 or 节点
     */
    setLoadingBox(node, scene) {
        this.loading_box = node;
        this.loading_box.zIndex = 99;
        this.loading_text = cc.find('text', this.loading_box).getComponent(cc.Label);
        this.loading_box.parent = scene;
        this.loading_box.active = false;
    }

    /**
     * 基础加载预制体
     * @param {string} name 资源名字
     * @param {Function} callback 回调
     */
    loadPrefab(name, callback = null) {
        this.loading_box.active = true;
        this.loading_text.string = '0%';
        cc.resources.load('prefab/' + name, cc.Prefab, (count, total, item) => {
            let val = count / total;
            this.loading_text.string = Math.floor(val * 100) + '%';
            // console.log(val);
        }, (err, res) => {
            this.loading_box.active = false;
            // if (err) return this.showToast('资源加载失败，请重试');
            if (typeof callback === 'function') callback(res);
        });
    }

    /**
     * 图片加载 resources文件下
     * @param {cc.Node} node 节点
     * @param {string} src 路径
     * @param {Function} callback 回调  
     */
    public static loadImg(src: string, node?: cc.Node, callback?: Function) {
        let load_count = 0;
        /** 加载失败时，重复加载 直到次数为 3 */
        let load = () => {
            load_count += 1;
            cc.resources.load(src, cc.SpriteFrame, (err, res: cc.SpriteFrame) => {
                if (err) {
                    console.log(`图片${src}加载错误重复加载次数 >>`, load_count);
                    if (load_count < 3) {
                        load();
                    }
                } else {
                    if (!!node) node.getComponent(cc.Sprite).spriteFrame = res;
                    if (!!callback) callback(res);
                }
            });
        }
        load();
    }

    public static loadImgAsync(src: string): Promise<cc.SpriteFrame> {
        return new Promise((resolve, reject) => {
            let load_count = 0;
            /** 加载失败时，重复加载 直到次数为 3 */
            let load = () => {
                load_count += 1;
                cc.resources.load(src, cc.SpriteFrame, (err, res: cc.SpriteFrame) => {
                    if (err) {
                        console.log(`图片${src}加载错误重复加载次数 >>`, load_count);
                        if (load_count < 3) {
                            load();
                        } else reject(null);
                    } else {
                        resolve(res);
                    }
                });
            }
            load();
        })
    }


    /**
     * 加载网络图片
     * @param {cc.Node} node 节点
     * @param {string} src 资源路径
     * @param {string} type 加载图片类型
     */
    public static loadNetImg(node, src, type = 'jpg') {
        cc.assetManager.loadRemote(src, (err, res) => {
            node.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(res);
        });
    }

    /**
     * @description 
     * @static
     * @param {*} dest
     * @param {*} scr
     * @memberof Utils
     */
    public static copy(dest, scr, ignore?) {
        for (let i in scr) {
            cc.log(scr.constructor.name, i, scr[i])
            if (!!ignore) {
                if (ignore == i) {
                    continue;
                }
            }
            dest[i] = scr[i];
        }
    }

    public static autoAdapt() {

        let size = cc.find('Canvas').getComponent(cc.Canvas).designResolution;


        let frameRatio = cc.view.getFrameSize().height / cc.view.getFrameSize().width;
        let designRation = size.height / size.width;

        if (frameRatio >= designRation) {
            cc.Canvas.instance.fitWidth = true;
            cc.Canvas.instance.fitHeight = false;

        } else {
            cc.Canvas.instance.fitWidth = false;
            cc.Canvas.instance.fitHeight = true;
        }
    }

    // 检查合法名。
    public static isValidVariableName(str) {
        if (typeof str !== 'string') {
            return false;
        }
        if (str.trim() !== str) {
            return false;
        }
        try {
            new Function(str, 'var ' + str);
        } catch (_) {
            return false;
        }
        return true;
    }
    public static delay(delayTime): Promise<void> {
        if (delayTime === 0) { delayTime = 100; }
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                resolve();
            }, delayTime);
        });
    }


}





