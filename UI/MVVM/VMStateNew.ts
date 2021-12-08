
import VMBase from './VMBase';
import { VM } from './VMManager';

const { ccclass, property, menu } = cc._decorator;

/**比较条件 */
export enum CONDITION {
    "==", //正常计算，比较 等于
    "!=", //正常计算，比较 不等于
    ">",  //正常计算，比较>
    ">=", //正常计算，比较>=
    "<",  //正常计算，比较<
    "<=", // 正常计算，比较<=
    "range" //计算在范围内
}


export enum ACTION {
    NODE_ACTIVE, //满足条件 的 节点激活 ，不满足的不激活
    NODE_VISIBLE, //满足条件 的节点显示，不满足的不显示
    NODE_OPACITY,  //满足条件的节点改变不透明度，不满足的还原255
    NODE_COLOR, //满足条件的节点改变颜色，不满足的恢复白色
    COMPONENT_CUSTOM, //自定义控制组件模式
}


export enum ChildModeType {
    NodeIndex,
    NodeName
}

// 要被比较的可能是数值，也可能是监控的路径的数值。
export enum DestValueType {
    Null,
    Path,
    Number,
}


export class VMStateDynamicConfig {
    sourceValuePath: string = '';
    foreachChildMode: boolean = false;
    foreachChildType: ChildModeType = ChildModeType.NodeIndex;
    condition: CONDITION = CONDITION["=="];
    destValue1Type: DestValueType = DestValueType.Null;
    destValue1_Number: number = 0;
    destValue1_Path: string = '';
    destValue2Type: DestValueType = DestValueType.Null;
    destValue2_Number: number = 0;
    destValue2_Path: string = '';
}

/**
 * [VM-State]
 * 监听数值状态,根据数值条件设置节点是否激活
 */
@ccclass
@menu('ModelViewer/VM-StateNew (VM状态控制新)')
export default class VMStateNew extends VMBase {

    //#region property
    protected watchPathArr: string[] = [];
    protected templateValueMap: Map<string, any> = new Map();

    @property({
        tooltip: '如比较两个数A与B，那么我们定义A是source value, B为dest value1.如果比较三个数，判断A是否在B-C之间，那么定义B为dest value1,C为dest value2',
        visible: function () { return this.dynamicConfig == false }
    })
    sourceValuePath: string = '';

    @property({
        tooltip: '遍历子节点,根据子节点的名字或名字转换为值，判断值满足条件 来激活',
        visible: function () { return this.dynamicConfig == false }
    })
    foreachChildMode: boolean = false;

    @property({
        type: cc.Enum(ChildModeType),
        tooltip: '遍历子节点,根据子节点的名字转换为值，判断值满足条件 来激活',
        visible: function () { return this.dynamicConfig == false && this.foreachChildMode === true }
    })
    foreachChildType: ChildModeType = ChildModeType.NodeIndex;

    @property({
        type: cc.Enum(CONDITION),
        visible: function () { return this.dynamicConfig == false }
    })
    condition: CONDITION = CONDITION["=="];

    @property({
        type: cc.Enum(DestValueType),
        visible: function () { return this.dynamicConfig == false && this.foreachChildMode === false }
    })
    destValue1Type: DestValueType = DestValueType.Null;

    @property({
        visible: function () { return this.dynamicConfig == false && this.foreachChildMode === false && this.destValue1Type === DestValueType.Number }
    })
    destValue1_Number: number = 0;

    @property({
        visible: function () { return this.dynamicConfig == false && this.foreachChildMode === false && this.destValue1Type === DestValueType.Path }
    })
    destValue1_Path: string = '';

    @property({
        type: cc.Enum(DestValueType),
        visible: function () { return this.dynamicConfig == false && this.foreachChildMode === false && this.condition === CONDITION.range }
    })
    destValue2Type: DestValueType = DestValueType.Null;

    @property({
        visible: function () { return this.dynamicConfig == false && this.foreachChildMode === false && this.destValue1Type === DestValueType.Number && this.condition === CONDITION.range }
    })
    destValue2_Number: number = 0;

    @property({
        visible: function () { return this.dynamicConfig == false && this.foreachChildMode === false && this.destValue1Type === DestValueType.Path && this.condition === CONDITION.range }
    })
    destValue2_Path: string = '';

    @property({
        type: cc.Enum(ACTION),
        tooltip: '一旦满足条件就对节点执行操作',
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
    //#endregion



    onLoad() {
        // 这样写的目的是，onload在dynamicConfig的情况下，还要手动调用一次，虽然调用2次但是只生效一次。
        if (this.dynamicConfig) {
            this.initPath();
            this.initWatchNodes();
            super.onLoad();
        } else {
            this.initPath();
            this.initWatchNodes();
            super.onLoad();
        }
    }

    //如果数组里没有监听值，那么默认把所有子节点给监听了
    private initWatchNodes() {
        // 当长度为0时，表示监听所有子节点。
        if (this.watchNodes.length !== 0) return;
        if (this.valueAction !== ACTION.NODE_ACTIVE && this.foreachChildMode === false) {
            this.watchNodes.push(this.node);
        }
        this.watchNodes = this.watchNodes.concat(this.node.children);

    }
    private initPath() {
        // 固定sourceValuePath是watchPathArr0
        if (this.sourceValuePath != '') {
            this.watchPathArr[0] = this.sourceValuePath;
        }
        // 固定sourceValuePath是watchPathArr1
        if (this.destValue1Type == DestValueType.Path && this.destValue1_Path != '') {
            this.watchPathArr[1] = this.destValue1_Path
        }
        // 固定sourceValuePath是watchPathArr2
        if (this.condition == CONDITION.range) {
            if (this.destValue2Type == DestValueType.Path && this.destValue2_Path != '') {
                this.watchPathArr[2] = this.destValue2_Path;
            }
        }
    }

    //当值初始化时
    protected onValueInit() {
        let sourceValue = VM.getValue(this.watchPathArr[0]);
        this.templateValueMap.set(this.watchPathArr[0], sourceValue);
        if (this.destValue1Type == DestValueType.Path && this.destValue1_Path != '') {
            let destValue1 = VM.getValue(this.watchPathArr[1]);
            this.templateValueMap.set(this.watchPathArr[1], destValue1);
        }
        if (this.condition == CONDITION.range) {
            if (this.destValue2Type == DestValueType.Path && this.destValue2_Path != '') {
                let destValue2 = VM.getValue(this.watchPathArr[2]);
                this.templateValueMap.set(this.watchPathArr[2], destValue2);
            }
        }
        this.checkNode(sourceValue);
    }

    //当值被改变时
    protected onValueChanged(newVar: any, oldVar: any, pathArr: any[]) {

        let path = pathArr.join('.');
        //寻找缓存位置
        let index = this.watchPathArr.findIndex(v => v === path);

        if (index >= 0) {
            //如果是所属的路径，就可以替换文本了
            this.templateValueMap.set(path, newVar);
        }
        this.checkNode(newVar);

    }

    //检查节点值更新
    private checkNode(value) {
        if (this.foreachChildMode) {
            this.watchNodes.forEach((node, index) => {
                let v = (this.foreachChildType === ChildModeType.NodeIndex) ? index : node.name;
                let check = this.conditionCheck(value, v);
                this.setNodeState(node, check);
            })
        } else {
            let destValue1 = 0;
            let destValue2 = 0;
            // 获得destValue1的值
            if (this.destValue1Type == DestValueType.Number) {
                destValue1 = this.destValue1_Number;
            } else {
                destValue1 = this.templateValueMap.get(this.watchPathArr[1]);
            }
            // 获得destValue2的值
            if (this.condition == CONDITION.range) {
                if (this.destValue2Type == DestValueType.Number) {
                    destValue2 = this.destValue2_Number;
                } else {
                    destValue1 = this.templateValueMap.get(this.watchPathArr[2]);
                }
            }
            let result = this.conditionCheck(this.templateValueMap.get(this.sourceValuePath), destValue1, destValue2);
            this.setNodesStates(result);
        }

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
    addDynamicConfig(config: VMStateDynamicConfig) {
        this.sourceValuePath = config.sourceValuePath
        this.foreachChildMode = config.foreachChildMode
        this.foreachChildType = config.foreachChildType
        this.condition = config.condition
        this.destValue1Type = config.destValue1Type
        this.destValue1_Number = config.destValue1_Number
        this.destValue1_Path = config.destValue1_Path
        this.destValue2Type = config.destValue2Type
        this.destValue2_Path = config.destValue2_Path
        this.destValue2_Number = config.destValue2_Number
        this.onLoad();
        this.enabled = true;
    }
}
