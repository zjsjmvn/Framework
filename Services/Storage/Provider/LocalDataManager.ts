import { IStorageProvider } from './IStorageProvider';
export default class LocalDataProvider implements IStorageProvider {
    constructor() {
    }
    clear() {
        cc.sys.localStorage.clear();
    }
    /**
     * 写入数据
     *
     * @param {*} key
     * @param {*} val
     */
    write(key: string, val: any) {
        if (!!key) {
            if (typeof val == 'object') {
                val = JSON.stringify(val);
            }
            cc.sys.localStorage.setItem(key, val);
        } else {
            cc.error("write key is undefined or null");
        }
    }
    /**
     * 读取数据
     *
     * @param {*} key
     * @param {*} def 默认
     * @returns 字符串
     */
    read(key: string, def?) {

        var val = cc.sys.localStorage.getItem(key);
        if (val == null || val.length == 0) {
            return def;
        }
        return val;
    }

    readObj<T>(key: string, def?: T): T {
        var val = this.read(key, null);
        if (!!val) {
            return JSON.parse(val);
        }
        return def;
    }
}
