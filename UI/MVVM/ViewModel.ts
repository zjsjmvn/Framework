import { Observer } from './Observer';

export const VM_EMIT_HEAD = 'VC:';

//通过 .  路径 设置值
export function setValueFromPath(obj: any, path: string, value: any, tag: string = '') {
    let props = path.split('.');
    for (let i = 0; i < props.length; i++) {
        const propName = props[i];
        if (propName in obj === false) { console.error('[' + propName + '] not find in ' + tag + '.' + path); break; }
        if (i == props.length - 1) {
            obj[propName] = value;
        } else {
            obj = obj[propName];
        }
    }

}

//通过 . 路径 获取值
export function getValueFromPath(obj: any, path: string, def?: any, tag: string = ''): any {
    let props = path.split('.');
    for (let i = 0; i < props.length; i++) {
        const propName = props[i];
        if ((propName in obj === false)) { console.error('[' + propName + '] not find in ' + tag + '.' + path); return def; }
        obj = obj[propName];
    }
    if (obj === null || typeof obj === "undefined") obj = def;//如果g == null 则返回一个默认值
    return obj;

}



/**
 * ModelViewer 类
 */
export class ViewModel<T>{
    constructor(data: T, tag: string) {
        new Observer(data, this._callback.bind(this));
        this.$data = data;
        this._tag = tag;
    }

    public $data: T;

    //索引值用的标签
    private _tag: string = null;

    /**激活状态, 将会通过 cc.director.emit 发送值变动的信号, 适合需要屏蔽的情况 */
    public active: boolean = true;

    /**是否激活根路径回调通知, 不激活的情况下 只能监听末端路径值来判断是否变化 */
    public emitToRootPath: boolean = false;

    //回调函数 请注意 回调的 path 数组是 引用类型，禁止修改
    private _callback(n: any, o: any, path: string[]): void {
        if (this.active == true) {
            let name = VM_EMIT_HEAD + this._tag + '.' + path.join('.')
            cc.director.emit(name, n, o, [this._tag].concat(path)); //通知末端路径

            if (this.emitToRootPath) cc.director.emit(VM_EMIT_HEAD + this._tag, n, o, path);//通知主路径

            if (path.length >= 2) {
                for (let i = 0; i < path.length - 1; i++) {
                    const e = path[i];
                    //cc.log('中端路径');

                }
            }

        }
    }

    //通过路径设置数据的方法
    public setValue(path: string, value: any) {
        setValueFromPath(this.$data, path, value, this._tag);
    }
    //获取路径的值
    public getValue(path: string, def?: any): any {
        return getValueFromPath(this.$data, path, def, this._tag);
    }
}

