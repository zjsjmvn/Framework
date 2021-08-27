import { EncryptUtil } from '../../../Tools/Encrypt/EncryptUtil';
import { md5 } from '../../../Tools/Encrypt/Md5';
import { IStorageProvider } from './IStorageProvider';
import { toString } from '../../../Collections/arrays';


export default class LocalDataProvider implements IStorageProvider {

    private _key: string | null = null;
    private _iv: string | null = null;

    /**
     * 初始化密钥
     * @param key aes加密的key 
     * @param iv aes加密的iv
     */
    constructor(key: string, iv: string) {
        this._key = md5(key);
        this._iv = md5(iv);
    }

    /**
     * 存储
     * @param key 存储key
     * @param value 存储值
     * @returns 
     */
    public write(key: string, value: any) {
        if (null == key) {
            console.error("存储的key不能为空");
            return;
        }
        key = md5(key);

        if (null == value) {
            console.warn("存储的值为空，则直接移除该存储");
            this.remove(key);
            return;
        }
        if (typeof value === 'function') {
            console.error("储存的值不能为方法");
            return;
        }
        if (typeof value === 'object') {
            try {
                value = JSON.stringify(value);
            } catch (e) {
                console.error(`解析失败，str=${value}`);
                return;
            }
        } else if (typeof value === 'number') {
            value = value + "";
        }
        if (null != this._key && null != this._iv) {
            try {
                value = EncryptUtil.aesEncrypt(value, this._key, this._iv);
            } catch (e) {
                value = null;
            }

        }
        cc.sys.localStorage.setItem(key, value);
    }

    /**
     * 获取
     * @param key 获取的key
     * @param defaultValue 获取的默认值
     * @returns 
     */
    public read(key: string, defaultValue?: any) {
        if (null == key) {
            console.error("存储的key不能为空");
            return;
        }
        key = md5(key);
        let str: string | null = cc.sys.localStorage.getItem(key);
        if (null != str && '' !== str && null != this._key && null != this._iv) {
            try {
                str = EncryptUtil.aesDecrypt(str, this._key, this._iv);
            } catch (e) {
                str = null;
            }
        }
        if (null == defaultValue || typeof defaultValue === 'string') {
            return str;
        }
        if (null === str) {
            return defaultValue;
        }
        if (typeof defaultValue === 'number') {
            return Number(str) || 0;
        }
        if (typeof defaultValue === 'boolean') {
            return "true" == str;
        }
        return str;
    }
    readObj<T>(key: string, def?: T): T {
        let str = this.read(key);
        try {
            if (str != null) {
                return JSON.parse(str);
            } else {
                return def;
            }
        } catch (e) {
            console.error("解析数据失败,key,", key + " str=" + str.toString());
            return def;
        }
    }
    /**
     * 移除某个值
     * @param key 需要移除的key 
     * @returns 
     */
    public remove(key: string) {
        if (null == key) {
            console.error("存储的key不能为空");
            return;
        }
        key = md5(key);
        cc.sys.localStorage.removeItem(key);
    }

    /**
     * 清空整个本地存储
     */
    public clear() {
        cc.sys.localStorage.clear();
    }
}