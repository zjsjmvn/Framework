import { toStatePaths } from 'xstate/lib/utils';
import { VM } from './VMManager';


//用来处理通知数据的层级
//控制旗下子节点的数据

//目前只是起到一个识别组件的作用，之后会抽象很多功能在这里面

// player.equips.* 可以自动根据所在父对象的位置设置顺序

const DEBUG_WATCH_PATH: boolean = true;


const { ccclass, property } = cc._decorator;


@ccclass
export default class VMBase extends cc.Component {

    /** watch 多路径 */
    public watchPathArr: Array<string> = [];

    /**储存模板多路径的值 */
    protected templateValueArr: any[] = [];
    @property()
    public _dynamicConfig: boolean = false;
    @property({
        tooltip: '动态配置代表这个节点的内容是代码配置的。比如生成背包的物品列表'
    })
    public set dynamicConfig(val: boolean) {
        this._dynamicConfig = val;
        if (this._dynamicConfig == true) {
            this.enabled = false;
        } else {
            this.enabled = true;
        }
    }
    public get dynamicConfig() {
        return this._dynamicConfig;
    }

    /**VM管理 */
    public VM = VM;

    /**
     * 如果需要重写onLoad 方法，请根据顺序调用 super.onLoad()，执行默认方法
     */
    onLoad() {
        if (CC_EDITOR) return;
        this.praseWatchPathArr();
    }

    praseWatchPathArr() {
        //提前进行路径数组 的 解析
        let pathArr = this.watchPathArr;
        if (pathArr.length >= 1) {
            for (let i = 0; i < pathArr.length; i++) {
                const path = pathArr[i];
                let paths = path.split('.');
                for (let i = 1; i < paths.length; i++) {
                    const p = paths[i];
                    if (p == '*') {
                        let index = this.node.getParent().children.findIndex(n => n === this.node);
                        if (index <= 0) index = 0;
                        paths[i] = index.toString();
                        break;
                    }
                }
                this.watchPathArr[i] = paths.join('.');
            }
        }
    }

    onEnable() {
        if (CC_EDITOR) return;//编辑器模式不能判断
        this.bindPathEvent(true);
        this.onValueInit();
    }

    onDisable() {
        if (CC_EDITOR) return;//编辑器模式不能判断
        this.bindPathEvent(false);
    }

    public changeWatchPath(paths: Array<string>) {
        this.watchPathArr = paths;
        this.praseWatchPathArr();
        this.bindPathEvent(true);
        this.onValueInit();
    }

    private bindPathEvent(enabled: boolean = true) {
        if (CC_EDITOR) return;
        let arr = this.watchPathArr;
        for (let i = 0; i < arr.length; i++) {
            const path = arr[i];
            if (enabled) {
                this.VM.bindPath(path, this.onValueChanged, this);
            } else {
                this.VM.unbindPath(path, this.onValueChanged, this);
            }
        }
    }

    protected onValueInit() {
        //虚方法

    }

    protected onValueChanged(newValue, oldValue, pathArr: string[]) {

    }

}
