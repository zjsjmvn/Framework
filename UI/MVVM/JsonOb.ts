import { indexOf } from '../../Collections/arrays';
import { Entity } from '../../ECS/Entitas/Entity';

/**
 * 实现动态绑定的核心部分，
 * 每次修改属性值，都会调用对应函数，并且获取值的路径
 */

const OP = Object.prototype;
const types = {
    obj: '[object Object]',
    array: '[object Array]'
}
const OAM = ['push', 'pop', 'shift', 'unshift', 'short', 'reverse', 'splice'];

let arr = new Array<number>();





/**
 * @description 对对象属性拦截
 * @date 2019-09-03
 * @export
 * @class JsonOb
 * @template T
 */
//TODO: 名字不太对
export class JsonOb<T> {
    /**
     * @description 搜索路径深度限制。
     * @private
     * @type {number}
     * @memberof JsonOb
     */
    private pathDepth: number = 5;
    private _callback: (newVal: any, oldVal: any, pathArray: string[]) => void = null;
    /**
     *Creates an instance of JsonOb.
     * @date 2019-09-03
     * @param {T} obj
     * @param {(newVal: any, oldVal: any, pathArray: string[]) => void} callback
     * @memberof JsonOb
     */
    constructor(obj: T, callback: (newVal: any, oldVal: any, pathArray: string[]) => void) {
        if (OP.toString.call(obj) !== types.obj && OP.toString.call(obj) !== types.array) {
            console.error('请传入一个对象或数组');
        }
        this._callback = callback;
        if (!!Entity && obj instanceof Entity) {
            obj._components.forEach((value) => {
                if (value == null) return;
                if (!!!value.mvvmPath) return;
                this.observe(value, [value.mvvmPath]);
            }, this)
        }
        if (!(obj instanceof Entity)) {
            this.observe(obj);
        }
    }


    /**
     * @description 
     * @date 2019-09-03
     * @private
     * @template T
     * @param {T} obj
     * @param {*} [path]
     * @memberof JsonOb
     */
    private observe<T>(obj: T, path?: Array<string>) {
        if (OP.toString.call(obj) === types.array) {
            this.overrideArrayProto(obj, path);
        }
        Object.keys(obj).forEach((key) => {
            let self = this;
            let oldVal = obj[key];
            let pathArray = path && path.slice();
            if (pathArray) {
                pathArray.push(key);
            }
            else {
                pathArray = [key];
            }
            Object.defineProperty(obj, key, {
                get: () => {
                    return oldVal;
                },
                set: (newVal) => {
                    if (oldVal !== newVal) {
                        if (OP.toString.call(newVal) === types.obj) {
                            // TODO: there is some error 
                            //  self.observe(newVal, pathArray);
                        }
                        oldVal = newVal

                        self._callback(newVal, oldVal, pathArray)
                    }
                }
            })

            if ((OP.toString.call(obj[key]) === types.obj || OP.toString.call(obj[key]) === types.array) && (path.length <= this.pathDepth)) {
                this.observe(obj[key], pathArray)
            }
            // console.log("observe ----", obj, "pathArray: ", pathArray);

        }, this)
    }

    /**
     * 对数组类型进行动态绑定
     * @param array 
     * @param path 
     */
    private overrideArrayProto(array: any, path) {
        // 保存原始 Array 原型  
        var originalProto = Array.prototype;
        // 通过 Object.create 方法创建一个对象，该对象的原型是Array.prototype  
        var overrideProto = Object.create(Array.prototype);
        var self = this;
        var result;


        // 遍历要重写的数组方法  
        OAM.forEach((method) => {
            Object.defineProperty(overrideProto, method, {
                value: function () {
                    var oldVal = this.slice();
                    //调用原始原型上的方法  
                    result = originalProto[method].apply(this, arguments);
                    //继续监听新数组  
                    self.observe(this, path);
                    self._callback(this, oldVal, path);
                    return result;
                }
            })
        });
        // 最后 让该数组实例的 __proto__ 属性指向 假的原型 overrideProto  
        array['__proto__'] = overrideProto;

    }



}




