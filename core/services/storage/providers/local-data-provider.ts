import { EncryptUtil } from '../../../../libs/encrypt/encrypt-util';
import { IStorageProvider } from './i-storage-provider';
import { sys } from 'cc';

export default class LocalDataProvider implements IStorageProvider {

    private _key: string | null = null;
    private _iv: string | null = null;
    private encrypted: boolean = true;

    /**
     * 初始化密钥
     * @param key aes加密的key 
     * @param iv aes加密的iv
     */
    constructor(encrypted = false, key: string = null, iv: string = null) {
        if (encrypted) {
            if (null == key || null == iv) {
                console.error("加密存储时，key和iv不能为空");
                return;
            }
            this._key = key;
            this._iv = iv;
        }
        this.encrypted = encrypted;
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
        if (this.encrypted) {
            key = EncryptUtil.md5(key);
        }

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
            value = value.toString();
        }
        if (null != this._key && null != this._iv && this.encrypted) {
            try {
                value = EncryptUtil.aesEncrypt(value, this._key, this._iv);
            } catch (e) {
                value = null;
            }

        }
        sys.localStorage.setItem(key, value);
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
        if (this.encrypted) {
            key = EncryptUtil.md5(key);
        }
        let str: string | null = sys.localStorage.getItem(key);
        if (null != str && '' !== str) {
            if (this.encrypted) {
                if (null != this._key && null != this._iv) {
                    try {
                        str = EncryptUtil.aesDecrypt(str, this._key, this._iv);
                    } catch (e) {
                        str = null;
                        console.log("解密失败，str=", str, e);
                    }
                } else {
                    console.error("读取加密数据时，key和iv不能为空");
                }
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
            if (str) {
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
        key = EncryptUtil.md5(key);
        sys.localStorage.removeItem(key);
    }

    /**
     * 清空整个本地存储
     */
    public clear() {
        sys.localStorage.clear();
    }
}


