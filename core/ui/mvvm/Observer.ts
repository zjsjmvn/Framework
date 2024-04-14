
/**
 * 实现动态绑定的核心部分，
 * 每次修改属性值，都会调用对应函数，并且获取值的路径
 */

import { Node, log } from "cc";
import { ECS } from "../../../libs/ecs/ecs";

const types = {
    obj: '[object Object]',
    array: '[object Array]',
    function: '[object Function]'
}
const ArrayMethodName = ['push', 'pop', 'shift', 'unshift', 'short', 'reverse', 'splice'];






/**
 * @description 对对象属性拦截
 * @date 2019-09-03
 * @export
 * @class Observer
 * @template T
 */
export class Observer<T> {
    /**
     * @description 搜索路径深度限制。
     * @private
     * @type {number}
     * @memberof Observer
     */
    private pathDepth: number = 5;
    private _callback: (newVal: any, oldVal: any, pathArray: string[]) => void = null;
    /**
     *Creates an instance of Observer.
     * @date 2019-09-03
     * @param {T} obj
     * @param {(newVal: any, oldVal: any, pathArray: string[]) => void} callback
     * @memberof Observer
     */
    constructor(obj: T, callback: (newVal: any, oldVal: any, pathArray: string[]) => void) {
        let d = Object.prototype.toString.call(obj);
        if (Object.prototype.toString.call(obj) !== types.obj && Object.prototype.toString.call(obj) !== types.array && Object.prototype.toString.call(obj) !== types.function) {
            console.error('请传入一个对象或数组');
        }
        this._callback = callback;
        if (!!ECS.Entity && obj instanceof ECS.Entity) {
            obj.componentTid2Obj.forEach((value, key) => {
                if (value == null) return;
                //@ts-ignore
                if (!!!value.mvvmPath) return;
                //@ts-ignore
                this.observe(value, [value.mvvmPath]);
            }, this)
        }
        if (!(obj instanceof ECS.Entity)) {
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
     * @memberof Observer
     */
    private observe<T>(obj: T, path?: Array<string>) {
        // 数组不处理
        if (Object.prototype.toString.call(obj) === types.array) return;
        // Node不处理
        if (obj instanceof Node) return;
        // Entity不处理
        if (obj instanceof ECS.Entity) return;

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
                        if (Object.prototype.toString.call(newVal) === types.obj) {
                            // TODO: there is some error 
                            //  self.observe(newVal, pathArray);
                        }
                        oldVal = newVal

                        self._callback(newVal, oldVal, pathArray)
                    }
                }
            })

            if ((Object.prototype.toString.call(obj[key]) === types.obj || Object.prototype.toString.call(obj[key]) === types.array) && (path.length <= this.pathDepth)) {
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
        ArrayMethodName.forEach((method) => {
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


