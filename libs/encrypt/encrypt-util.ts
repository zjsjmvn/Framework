
export class EncryptUtil {
    private static JsonFormatter = {
        stringify: function (cipherParams: any) {
            const jsonObj: any = { ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64) };
            if (cipherParams.iv) {
                jsonObj.iv = cipherParams.iv.toString();
            }
            if (cipherParams.salt) {
                jsonObj.s = cipherParams.salt.toString();
            }
            return JSON.stringify(jsonObj);
        },
        parse: function (jsonStr: any) {
            const jsonObj = JSON.parse(jsonStr);
            const cipherParams = CryptoJS.lib.CipherParams.create(
                { ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct) },
            );
            if (jsonObj.iv) {
                cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv)
            }
            if (jsonObj.s) {
                cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s)
            }
            return cipherParams;
        },
    };

    /**
     * MD5加密
     * @param msg 加密信息
     */
    static md5(msg: string): string {
        return CryptoJS.MD5(msg).toString();
    }



    /**
     * AES 加密
     * @param msg 加密信息
     * @param key aes加密的key 
     * @param iv  aes加密的iv
     */
    static aesEncrypt(msg: string, key: string, iv: string): string {
        return CryptoJS.AES.encrypt(
            msg,
            key,
            {
                iv: CryptoJS.enc.Hex.parse(iv),
                format: this.JsonFormatter
            },
        ).toString();
    }

    /**
     * AES 解密
     * @param str 解密字符串
     * @param key aes加密的key 
     * @param iv  aes加密的iv
     */
    static aesDecrypt(str: string, key: string, iv: string): string {
        const decrypted = CryptoJS.AES.decrypt(
            str,
            key,
            {
                iv: CryptoJS.enc.Hex.parse(iv),
                format: this.JsonFormatter
            },
        );
        return decrypted.toString(CryptoJS.enc.Utf8);
    }



    // base64加密
    static base64Encode(str: string): string {
        return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str));
    }

    // base64解密
    static base64Decode(str: string): string {
        return CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Utf8);
    }

}