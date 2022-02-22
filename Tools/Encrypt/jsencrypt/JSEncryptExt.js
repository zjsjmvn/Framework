// let  JSEncrypt = require("jsencrypt");
// import {hex2b64} from "jsencrypt"
// import { b64tohex, hex2b64 } from "../../../../../node_modules/jsencrypt";
// let hex2b64 = require('jsencrypt')
// import {hex2b64} from 'jsencrypt'
//十六进制转字节

import JSEncrypt from "./lib/JSEncrypt";
import { b64tohex, hex2b64 } from "./lib/lib/jsbn/base64";
// hex2b64

export function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

// 字节转十六进制
export function bytesToHex(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
    }
    return hex.join("");
}

//方法一
JSEncrypt.prototype.encryptLong = function (d) {
    var k = this.key;
    var maxLength = (((k.n.bitLength() + 7) >> 3) - 11);

    try {
        var lt = "";
        var ct = "";

        if (d.length > maxLength) {
            lt = d.match(/.{1,117}/g);
            lt.forEach(function (entry) {
                var t1 = k.encrypt(entry);
                ct += t1;
            });
            return hexToBytes(ct);
        }
        var t = k.encrypt(d);
        var y = hexToBytes(t);
        return y;
    } catch (ex) {
        return false;
    }
}

JSEncrypt.prototype.decryptLong = function (string) {
    var k = this.getKey();
    var maxLength = ((k.n.bitLength() + 7) >> 3);
    //var maxLength = 128;
    try {

        var str = bytesToHex(string);
        //var b=hex2Bytes(str);

        var inputLen = str.length;

        var ct = "";
        if (str.length > maxLength) {

            var lt = str.match(/.{1,256}/g);
            lt.forEach(function (entry) {
                var t1 = k.decrypt(entry);
                ct += t1;
            });
            return ct;
        }
        var y = k.decrypt(bytesToHex(string));
        return y;
    } catch (ex) {
        return false;
    }
};

//方法2
JSEncrypt.prototype.encryptLong2 = function (string) {
    var k = this.getKey();
    var maxLength = ((k.n.bitLength()+7)>>3);
    cc.log('maxLength',maxLength)
    try {
        var lt = "";
        var ct = "";
        //RSA每次加密117bytes，需要辅助方法判断字符串截取位置
        //1.获取字符串截取点
        var bytes = new Array();
        bytes.push(0);
        var byteNo = 0;
        var len, c;
        len = string.length;
        var temp = 0;
        for (var i = 0; i < len; i++) {
            c = string.charCodeAt(i);
            if (c >= 0x010000 && c <= 0x10FFFF) {
                byteNo += 4;
            } else if (c >= 0x000800 && c <= 0x00FFFF) {
                byteNo += 3;
            } else if (c >= 0x000080 && c <= 0x0007FF) {
                byteNo += 2;
            } else {
                byteNo += 1;
            }
            if ((byteNo % (maxLength-11)) >= (maxLength-14) || (byteNo %  (maxLength-11)) == 0) {
                if (byteNo - temp >=  (maxLength-14)) {
                    bytes.push(i);
                    temp = byteNo;
                }
            }
        }
        //2.截取字符串并分段加密
        if (bytes.length > 1) {
            for (var i = 0; i < bytes.length - 1; i++) {
                var str;
                if (i == 0) {
                    str = string.substring(0, bytes[i + 1] + 1);
                } else {
                    str = string.substring(bytes[i] + 1, bytes[i + 1] + 1);
                }
                var t1 = k.encrypt(str);
                ct += t1;
            }
            ;
            if (bytes[bytes.length - 1] != string.length - 1) {
                var lastStr = string.substring(bytes[bytes.length - 1] + 1);
                ct += k.encrypt(lastStr);
            }
            return hex2b64(ct);
        }
        var t = k.encrypt(string);
        var y = hex2b64(t);
        return y;
    } catch (ex) {
        return false;
    }
};

JSEncrypt.prototype.decryptLong2 = function (string) {
    var k = this.getKey();
    var maxLength = ((k.n.bitLength()+7)>>3);
    var MAX_DECRYPT_BLOCK = maxLength;
    try {
        var ct = "";
        var t1;
        var bufTmp;
        var hexTmp;
        // var str = bytesToHex(string);
      var str=    b64tohex(string)
        var buf = hexToBytes(str);
        var inputLen = buf.length;
        //开始长度
        var offSet = 0;
        //结束长度
        var endOffSet = MAX_DECRYPT_BLOCK;

        //分段加密
        while (inputLen - offSet > 0) {
            if (inputLen - offSet > MAX_DECRYPT_BLOCK) {
                bufTmp = buf.slice(offSet, endOffSet);
                hexTmp = bytesToHex(bufTmp);
                t1 = k.decrypt(hexTmp);
                ct += t1;

            } else {
                bufTmp = buf.slice(offSet, inputLen);
                hexTmp = bytesToHex(bufTmp);
                t1 = k.decrypt(hexTmp);
                ct += t1;

            }
            offSet += MAX_DECRYPT_BLOCK;
            endOffSet += MAX_DECRYPT_BLOCK;
        }
        return ct;
    } catch (ex) {
        return false;
    }
};