import { _decorator, CCString, Component, Enum, EventHandler } from 'cc';
import VMBase from './vm-base';

// VMEvent 只负责“值变化后触发事件”。下面这些旧设想属于其它 VM 组件能力，保留为边界说明：
// + 普通 label 更新数据的情况：label.string = xxx。
// + frameIndex 插件：通过 number 数值设置 BhvFrameIndex 来切换当前贴图。
// + spriteFrame 直接替换贴图：本地路径 data.spriteFrame = $res:/pic/com1，网络路径 data.spriteFrame = $url:http:xxxxxxxxxx.png。
// + 特殊条件控制。

// 比较条件:,如果传入值 > /< />= /<= /== 某值时，执行的action类型

const { ccclass, property, executeInEditMode, menu } = _decorator;

// enum WatchMode {
//     ccLabel,
//     ccRichText,
//     ccSlider,
//     ccProgressBar,
// }

export enum FILTER_MODE {
    "none",
    "==", //正常计算，比较 等于
    "!=", //正常计算，比较 不等于
    ">",  //正常计算，比较>
    ">=", //正常计算，比较>=
    "<",  //正常计算，比较<
    "<=", // 正常计算，比较>=
}

/**
 *  [VM-Event]
 * 提供  ViewModel 的相关基础功能,
 * 如果值发生变化将会调用对应的函数方法
 */
@ccclass
@executeInEditMode
@menu('ModelViewer/VM-EventCall(调用函数)')
export default class VMEvent extends VMBase {


    @property({
        tooltip: '触发一次后会自动关闭该事件'
    })
    triggerOnce: boolean = false;

    @property({
        tooltip: '监听获取值的多条路径,这些值的改变都会通过这个函数回调,请使用 pathArr 区分获取的值 ',
        type: [CCString],
        visible: function () { return true }
    })
    public watchPathArr: string[] = [];

    @property({
        tooltip: '过滤模式，会根据条件过滤掉时间的触发',
        type: Enum(FILTER_MODE)
    })
    public filterMode: FILTER_MODE = FILTER_MODE.none;

    @property({
        visible: function () { return this.filterMode !== FILTER_MODE.none }
    })
    public compareValue: string = '';


    @property([Component.EventHandler])
    changeEvents: EventHandler[] = [];

    /** 初始化阶段不主动触发事件，避免界面刚加载就执行业务回调。 */
    onValueInit() {

        // let newVar = this.VM.getValue(this.watchPathArr[0]);

        // if(Array.isArray(this.changeEvents)){
        //     this.changeEvents.forEach(v=>{
        //         v.emit([newVar]);
        //     })
        // }
    }

    onValueChanged(newVar: any, oldVar: any, pathArr: any[]) {
        let res = this.conditionCheck(newVar, this.compareValue);
        if (!res) return;

        if (Array.isArray(this.changeEvents)) {
            this.changeEvents.forEach(v => {
                v.emit([newVar, oldVar, pathArr]);
            })
        }

        //激活一次后，自动关闭组件
        if (this.triggerOnce === true) {
            this.enabled = false;
        }
    }


    /**条件检查 */
    private conditionCheck(a, b): boolean {
        let cod = FILTER_MODE;

        switch (this.filterMode) {
            case cod.none:
                return true;
            case cod["=="]:
                if (a == b) return true;
                break;
            case cod["!="]:
                if (a != b) return true;
                break;
            case cod["<"]:
                if (a < b) return true;
                break;
            case cod[">"]:
                if (a > b) return true;
                break;
            case cod[">="]:
                if (a >= b) return true;
                break;
            case cod["<"]:
                if (a < b) return true;
                break;
            case cod["<="]:
                if (a <= b) return true;
                break;

            default:
                break;
        }

        return false;
    }

    // update (dt) {}
}
