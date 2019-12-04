import VMBase from "./VMBase";
import VMCustom from "./VMCustom";
import { StringFormatFunction } from "./StringFormat";

const { ccclass, property, menu } = cc._decorator;


@ccclass
@menu('ModelViewer/VM-Progress (VM-进度条)')
export default class VMProgress extends VMCustom {

    @property({
        type: [cc.String],
        tooltip: '第一个值是min 值，第二个值 是 max 值，会计算出两者的比例'
    })
    protected watchPathArr: string[] = ['[min]', '[max]'];

    public templateMode: boolean = true;

    @property({
        visible: function () { return this.componentProperty === 'string' },
        tooltip: '字符串格式化，和 VMLabel 的字段一样，需要填入对应的格式化字符串'
    })
    stringFormat: string = '';


    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        //cc.log(this.watchPathArr)
        if (this.watchPathArr.length < 2 || this.watchPathArr[0] == '[min]' || this.watchPathArr[1] == '[max]') {
            console.error('VMProgress must have two values!');
        }
        super.onLoad();
    }

    start() {
        if (CC_EDITOR) return;
        this.onValueInit();
    }

    onValueInit() {

        let max = this.watchPathArr.length;
        for (let i = 0; i < max; i++) {
            this.templateValueArr[i] = this.VM.getValue(this.watchPathArr[i]);
        }

        let value = this.templateValueArr[0] / this.templateValueArr[1];
        this.setComponentValue(value);
    }

    setComponentValue(value: any) {
        if (this.stringFormat !== '') {
            let res = StringFormatFunction.deal(value, this.stringFormat);
            super.setComponentValue(res);
        } else {
            super.setComponentValue(value);
        }
    }

    onValueController(n, o) {
        let value = Math.round(n * this.templateValueArr[1]);
        if (Number.isNaN(value)) value = 0;
        this.VM.setValue(this.watchPathArr[0], value);
    }

    /**初始化改变数据 */
    onValueChanged(n, o, pathArr: string[]) {
        if (this.templateMode === false) return;


        let path = pathArr.join('.');
        //寻找缓存位置
        let index = this.watchPathArr.findIndex(v => v === path);
        if (index >= 0) {
            //如果是所属的路径，就可以替换文本了
            this.templateValueArr[index] = n; //缓存值
        }

        let value = this.templateValueArr[0] / this.templateValueArr[1];
        if (value > 1) value = 1;
        if (value < 0 || Number.isNaN(value)) value = 0;

        this.setComponentValue(value);
    }


}
