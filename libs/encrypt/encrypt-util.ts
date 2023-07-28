import { log } from "cc";

export class EncryptUtil {
    /**
     * @description 加密
     * @static
     * @param {string} msg
     * @param {string} key
     * @param {string} iv
     * @return {*}  {string}
     * @memberof EncryptUtil
     */
    static aesEncrypt(msg: string, key: string, iv: string): string {
        let wordArrayMsg = CryptoJS.enc.Utf8.parse(msg);
        let wordArrayKey = CryptoJS.enc.Utf8.parse(key);
        let wordArrayIV = CryptoJS.enc.Utf8.parse(iv);
        let encrypted = CryptoJS.AES.encrypt(
            wordArrayMsg,
            wordArrayKey,
            {
                iv: wordArrayIV,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
        let encryptedBase64Data = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
        return encryptedBase64Data;
    }

    /**
     * @description URI encode之后加密
     * @static
     * @param {string} msg
     * @param {string} key
     * @param {string} iv
     * @return {*}  {string}
     * @memberof EncryptUtil
     */
    static aesEncryptWithURIEncode(msg: string, key: string, iv: string): string {
        msg = encodeURIComponent(msg);
        return this.aesEncrypt(msg, key, iv);
    }


    /**
     * @description 解密，然后decodeURI
     * @static
     * @param {string} str
     * @param {string} key
     * @param {string} iv
     * @return {*}  {string}
     * @memberof EncryptUtil
     */
    static aesDecryptWithURIDecode(str: string, key: string, iv: string): string {
        str = str.replace(/\r\n/g, "").replace(/\r/g, "").replace(/\n/g, "");
        str = this.aesDecrypt(str, key, iv);
        return decodeURIComponent(str);
    }

    /**
     * @description 解密
     * @static
     * @param {string} str
     * @param {string} key
     * @param {string} iv
     * @return {*}  {string}
     * @memberof EncryptUtil
     */
    static aesDecrypt(str: string, key: string, iv: string): string {
        let wordArrayKey = CryptoJS.enc.Utf8.parse(key);
        let wordArrayIV = CryptoJS.enc.Utf8.parse(iv);
        let encryptedHexStr = CryptoJS.enc.Base64.parse(str);
        let wordArrayMsg = CryptoJS.enc.Base64.stringify(encryptedHexStr);
        let decrypt = CryptoJS.AES.decrypt(
            wordArrayMsg,
            wordArrayKey,
            {
                iv: wordArrayIV,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
        let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
        return decryptedStr.toString();
    }


    // base64加密
    static base64Encode(str: string): string {
        return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str));
    }

    // base64解密
    static base64Decode(str: string): string {
        return CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Utf8);
    }
    /**
     * MD5加密
     * @param msg 加密信息
     */
    static md5(msg: string): string {
        return CryptoJS.MD5(msg).toString();
    }
}




