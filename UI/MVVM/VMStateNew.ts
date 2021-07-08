
import VMBase from './VMBase';
import { VM } from './VMManager';

const { ccclass, property, menu } = cc._decorator;

/**比较条件 */
enum CONDITION {
    "==", //正常计算，比较 等于
    "!=", //正常计算，比较 不等于
    ">",  //正常计算，比较>
    ">=", //正常计算，比较>=
    "<",  //正常计算，比较<
    "<=", // 正常计算，比较<=
    "range" //计算在范围内
}


enum ACTION {
    NODE_ACTIVE, //满足条件 的 节点激活 ，不满足的不激活
    NODE_VISIBLE, //满足条件 的节点显示，不满足的不显示
    NODE_OPACITY,  //满足条件的节点改变不透明度，不满足的还原255
    NODE_COLOR, //满足条件的节点改变颜色，不满足的恢复白色
    COMPONENT_CUSTOM, //自定义控制组件模式
}


enum CHILD_MODE_TYPE {
    NODE_INDEX,
    NODE_NAME
}

// 要被比较的可能是数值，也可能是监控的路径的数值。
enum DestValueType {
    Path,
    Number,
}


/**
 * [VM-State]
 * 监听数值状态,根据数值条件设置节点是否激活
 */
@ccclass
@menu('ModelViewer/VM-StateNew (VM状态控制新)')
export default class VMStateNew extends VMBase {

    protected watchPathArr: string[] = [];
    protected templateValueArr: Array<any> = new Array<any>();

    @property({
        tooltip: '如比较两个数A与B，那么我们定义A是source value, B为dest value1.如果比较三个数，判断A是否在B-C之间，那么定义B为dest value1,C为dest value2',
    })
    sourceValuePath: string = '';
    sourceValue: number;

    @property({
        type: cc.Enum(CONDITION),
    })
    condition: CONDITION = CONDITION["=="];

    @property({
        type: cc.Enum(DestValueType)
    })
    destValue1Type: DestValueType = DestValueType.Number;

    @property({
        visible: function () { return this.destValue1Type === DestValueType.Number }

    })
    destValue1_Number: number = 0;

    @property({
        visible: function () { return this.destValue1Type === DestValueType.Path }
    })
    destValue1_Path: string = '';

    destValue1: number = 0;

    @property({
        type: cc.Enum(DestValueType),
        visible: function () { return this.condition === CONDITION.range }
    })
    destValue2Type: DestValueType = DestValueType.Number;

    @property({
        visible: function () { return this.destValue1Type === DestValueType.Number && this.condition === CONDITION.range }
    })
    destValue2_Number: number = 0;

    @property({
        visible: function () { return this.destValue1Type === DestValueType.Path && this.condition === CONDITION.range }
    })
    destValue2_Path: string = '';

    destValue2: number = 0;


    @property({
        type: cc.Enum(ACTION),
        tooltip: '一旦满足条件就对节点执行操作'
    })
    valueAction: ACTION = ACTION.NODE_ACTIVE;

    @property({
        visible: function () { return this.valueAction === ACTION.NODE_OPACITY },
        range: [0, 255],
        type: cc.Integer,
        displayName: 'Action Opacity'
    })
    valueActionOpacity: number = 0;

    @property({
        visible: function () { return this.valueAction === ACTION.NODE_COLOR },
        displayName: 'Action Color'
    })
    valueActionColor: cc.Color = cc.color(155, 155, 155);


    @property({
        visible: function () { return this.valueAction === ACTION.COMPONENT_CUSTOM },
        displayName: 'Component Name'
    })
    valueComponentName: string = '';

    @property({
        visible: function () { return this.valueAction === ACTION.COMPONENT_CUSTOM },
        displayName: 'Component Property'
    })
    valueComponentProperty: string = '';

    @property({
        visible: function () { return this.valueAction === ACTION.COMPONENT_CUSTOM },
        displayName: 'Default Value'
    })
    valueComponentDefaultValue: string = '';

    @property({
        visible: function () { return this.valueAction === ACTION.COMPONENT_CUSTOM },
        displayName: 'Action Value'
    })

    valueComponentActionValue: string = '';
    @property({
        type: [cc.Node],
        tooltip: '需要执行条件的节点，如果不填写则默认会执行本节点以及本节点的所有子节点 的状态'
    })

    watchNodes: cc.Node[] = [];


    // LIFE-CYCLE CALLBACKS:

    onLoad() {

        this.watchPathArr.push(this.sourceValuePath);
        if (this.destValue1Type == DestValueType.Path) {
            this.watchPathArr.push(this.destValue1_Path);
        }
        if (this.condition == CONDITION.range) {
            if (this.destValue2Type == DestValueType.Path) {
                this.watchPathArr.push(this.destValue2_Path);
            }
        }
        super.onLoad();
        //如果数组里没有监听值，那么默认把所有子节点给监听了
        if (this.watchNodes.length == 0) {
            if (this.valueAction !== ACTION.NODE_ACTIVE) {
                this.watchNodes.push(this.node);
            }
            //TODO:子节点貌似没太大必要
            // this.watchNodes = this.watchNodes.concat(this.node.children);
        }

        if (this.enabled) this.onValueInit();
    }

    //当值初始化时
    protected onValueInit() {
        let sourceValue = VM.getValue(this.watchPathArr[0]);
        this.templateValueArr[0] = sourceValue;
        if (this.destValue1Type == DestValueType.Path) {
            let destValue1 = VM.getValue(this.watchPathArr[1]);
            this.templateValueArr[1] = destValue1;
        }
        if (this.condition == CONDITION.range) {
            if (this.destValue2Type == DestValueType.Path) {
                let destValue2 = VM.getValue(this.watchPathArr[2]);
                this.templateValueArr[2] = destValue2;
            }
        }
        this.checkNodeFromValue(sourceValue);
    }

    //当值被改变时
    protected onValueChanged(newVar: any, oldVar: any, pathArr: any[]) {

        let path = pathArr.join('.');
        //寻找缓存位置
        let index = this.watchPathArr.findIndex(v => v === path);

        if (index >= 0) {
            //如果是所属的路径，就可以替换文本了
            this.templateValueArr[index] = newVar; //缓存值
        }
        this.checkNodeFromValue(newVar);

    }

    //检查节点值更新
    private checkNodeFromValue(value) {

        let destValue1 = 0;
        let destValue2 = 0;
        let index = 1;
        if (this.destValue1Type == DestValueType.Number) {
            destValue1 = this.destValue1_Number;
        } else {
            // 获得destValue1的值
            destValue1 = this.templateValueArr[index];
            index++;
        }
        if (this.condition == CONDITION.range) {
            if (this.destValue2Type == DestValueType.Path) {
                destValue2 = this.templateValueArr[index];
            } else {
                destValue2 = this.destValue2_Number;
            }
        }

        let check = this.conditionCheck(this.templateValueArr[0], destValue1, destValue2);
        this.setNodesStates(check);
    }

    //更新 多个节点 的 状态
    private setNodesStates(checkState?: boolean) {
        this.watchNodes.forEach((node) => {
            this.setNodeState(node, checkState);
        })
    }

    /**更新单个节点的状态 */
    private setNodeState(node: cc.Node, checkState?: boolean) {
        let a = ACTION;
        switch (this.valueAction) {
            case a.NODE_ACTIVE: node.active = checkState ? true : false; break;
            case a.NODE_VISIBLE: node.opacity = checkState ? 255 : 0; break;
            case a.NODE_COLOR: node.color = checkState ? this.valueActionColor : cc.color(255, 255, 255); break;
            case a.NODE_OPACITY: node.opacity = checkState ? this.valueActionOpacity : 255; break;

            case a.COMPONENT_CUSTOM:
                let comp = node.getComponent(this.valueComponentName);
                if (comp == null) return;
                if (this.valueComponentProperty in comp) {
                    comp[this.valueComponentProperty] = checkState ? this.valueComponentActionValue : this.valueComponentDefaultValue;
                }
                break;

            default:
                break;
        }
    }


    /**条件检查 */
    private conditionCheck(newValue, valueA, valueB?): boolean {
        const cod = CONDITION;
        switch (this.condition) {
            case cod["=="]:
                if (newValue == valueA) return true;
                break;
            case cod["!="]:
                if (newValue != valueA) return true;
                break;
            case cod["<"]:
                if (newValue < valueA) return true;
                break;
            case cod[">"]:
                if (newValue > valueA) return true;
                break;
            case cod[">="]:
                if (newValue >= valueA) return true;
                break;
            case cod["<"]:
                if (newValue < valueA) return true;
                break;
            case cod["<="]:
                if (newValue <= valueA) return true;
                break;
            case cod["range"]:
                if (newValue >= valueA && newValue <= valueB) return true;
                break;

            default:
                break;
        }

        return false;
    }




}
