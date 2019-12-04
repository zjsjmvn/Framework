import { VM } from './ViewModel';


//用来处理通知数据的层级
//控制旗下子节点的数据

//目前只是起到一个识别组件的作用，之后会抽象很多功能在这里面

// player.equips.* 可以自动根据所在父对象的位置设置顺序

const DEBUG_WATCH_PATH: boolean = true;


const { ccclass, property } = cc._decorator;


@ccclass
export default class VMBase extends cc.Component {

    /** watch 多路径 */
    protected watchPathArr: Array<string> = [];

    /**储存模板多路径的值 */
    protected templateValueArr: any[] = [];

    /**VM管理 */
    public VM = VM;

    /**
     * 如果需要重写onLoad 方法，请根据顺序调用 super.onLoad()，执行默认方法
     */
    onLoad() {
        if (CC_EDITOR) return;

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

        //打印出所有绑定的路径，方便调试信息
        if (DEBUG_WATCH_PATH && CC_DEBUG) {
            // cc.log('所有监听路径', this.watchPathArr, '<<', this.node.getParent().name + '.' + this.node.name)
        }

        if (this.watchPathArr.join('') == '') {
            // cc.log('可能未设置路径的节点:', this.node.getParent().name + '.' + this.node.name);
        }


    }

    onEnable() {
        if (CC_EDITOR) return;//编辑器模式不能判断
        this.setMultPathEvent(true);


        this.onValueInit();//激活时,调用值初始化
    }

    onDisable() {
        if (CC_EDITOR) return;//编辑器模式不能判断
        this.setMultPathEvent(false);

    }

    //多路径监听方式
    private setMultPathEvent(enabled: boolean = true) {
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

    protected onValueChanged(n, o, pathArr: string[]) {

    }

}
