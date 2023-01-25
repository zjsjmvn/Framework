import { EDITOR } from 'cc/env';
import VMBase from './VMBase';
import { Toggle, _decorator } from 'cc';

const { ccclass, property, executeInEditMode, menu } = _decorator;


/**自动检查识别的数组,你可以准备自己的组件放上去自动识别 */
const COMP_ARRAY_CHECK = [
    ['BhvFrameIndex', 'index', false],
    ['BhvGroupToggle', 'index', false],
    ['BhvRollNumber', 'targetValue', false],
    //组件名、默认属性、controller值
    ['Label', 'string', false],
    ['RichText', 'string', false],
    ['EditBox', 'string', true],
    ['Slider', 'progress', true],
    ['ProgressBar', 'progress', false],
    ['Toggle', 'isChecked', true]
];


/**
 * [VM-Custom]
 * 自定义数值监听, 可以快速对该节点上任意一个组件上的属性进行双向绑定
 */
@ccclass
@executeInEditMode
@menu('ModelViewer/VM-Custom (自定义VM)')
export default class VMCustom extends VMBase {

    @property({
        tooltip: '激活controller,以开启双向绑定，否则只能接收消息'
    })
    controller: boolean = false;



    @property({
        tooltip: '绑定组件的名字'
    })
    componentName: string = "";

    @property({
        tooltip: '组件上需要监听的属性'
    })
    componentProperty: string = "";

    @property({
        tooltip: '刷新间隔频率(只影响脏检查的频率)',
        step: 0.01,
        range: [0, 1],
        visible: function () { return this.controller === true }
    })
    refreshRate: number = 0.1;


    //计时器
    private _timer = 0;

    /**监听的组件对象 */
    private _watchComponent: any = null;

    /**是否能监听组件的数据 */
    private _canWatchComponent: boolean = false;

    /**检查的值 */
    private _oldValue: any = null;


    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        super.onLoad();
        //只在运行时检查组件是否缺失可用
        this.checkEditorComponent();//编辑器检查
        if (!EDITOR) {
            this._watchComponent = this.node.getComponent(this.componentName);
            this.checkComponentState();
        }
    }

    onRestore() {
        this.checkEditorComponent();
    }

    start() {
        //从 watch 的路径中获取一个初始值
        this.onValueInit();
    }

    //挂在对应节点后，自动获取组件属性和名字
    checkEditorComponent() {
        if (EDITOR) {
            let checkArray = COMP_ARRAY_CHECK;
            this.controller = false;
            for (let i = 0; i < checkArray.length; i++) {
                const params = checkArray[i];
                let comp = this.node.getComponent(params[0] as string);
                if (comp) {
                    if (this.componentName == '') this.componentName = params[0] as string;
                    if (this.componentProperty == '') this.componentProperty = params[1] as string;
                    if (params[2] !== null) this.controller = params[2] as boolean;

                    break;
                }

            }
        }


    }

    checkComponentState() {
        this._canWatchComponent = false;
        if (!this._watchComponent) { console.error('未设置需要监听的组件'); return; }
        if (!this.componentProperty) { console.error('未设置需要监听的组件 的属性'); return; }
        if (this.componentProperty in this._watchComponent === false) { console.error('需要监听的组件的属性不存在'); return; }
        this._canWatchComponent = true;
    }

    getComponentValue() {
        return this._watchComponent[this.componentProperty];

    }

    setComponentValue(value: any) {
        //如果遇到Toggle 组件就调用上面的方法解决
        if (this.componentName == "Toggle") {
            if (value == true) {
                this.node.getComponent(Toggle).isChecked = true;
            }
            if (value == false) {
                this.node.getComponent(Toggle).isChecked = false;
            }
        } else {
            this._watchComponent[this.componentProperty] = value;
        }
    }


    /**初始化获取数据 */
    onValueInit() {
        if (EDITOR) return; //编辑器模式不初始化
        //更新信息
        //this.setComponentValue(this.VM.getValue(this.watchPath));
    }

    /**[可重写]组件的值发生变化后，触发更新此值 */
    onValueController(newValue, oldValue) {
        //this.VM.setValue(this.watchPath, newValue);
    }

    /**[可重写]初始化改变数据 */
    onValueChanged(n, o, pathArr: string[]) {
        this.setComponentValue(n);
    }

    update(dt) {
        //脏检查（组件是否存在，是否被激活）
        if (EDITOR == true) return;
        //if (this.templateMode == true) return; //todo 模板模式下不能计算  
        if (!this.controller) return;
        if (!this._canWatchComponent || this._watchComponent['enabled'] === false) return;

        //刷新频率检查
        this._timer += dt;
        if (this._timer < this.refreshRate) return;
        this._timer = 0;

        let oldValue = this._oldValue;
        let newValue = this.getComponentValue();

        if (this._oldValue === newValue) return;
        this._oldValue = this.getComponentValue();
        this.onValueController(newValue, oldValue);

    }
}
