import { IStorageProvider } from './IStorageProvider';
var BackMusic = "BackMusic";
var MusicEffect = "MusicEffect";
var LoginTime = "LoginTime";
var IDList = "IDList";
var ExistFlag = "ExistFlag";
const SameDay = 'SameDay';

/**
 * 
 * 应该只提供读写功能。其他都是外层的事情了
 *
 */
export default class LocalDataManager implements IStorageProvider {
    constructor() {
        this.initLocalData();
    }
    clear() {
        cc.sys.localStorage.clear();
    }
    initLocalData() {
        var exist = this.read(ExistFlag);
        if (!!exist) {
            this.write(ExistFlag, true);
            this.resetLocalUserData();
        }
    }
    resetLocalUserData() {
        this.write(BackMusic, true);
        this.write(MusicEffect, true);
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


window.LocalDataManager = new LocalDataManager();


