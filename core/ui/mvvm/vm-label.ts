import { _decorator, error, CCString } from 'cc';
import { EDITOR } from 'cc/env';
import VMBase from './vm-base';
import { StringFormatFunction } from './string-format';

const { ccclass, property, menu, executeInEditMode } = _decorator;

export enum LABEL_TYPE {
    CC_LABEL = 'Label',
    CC_RICH_TEXT = 'RichText',
    CC_EDIT_BOX = 'EditBox'
}


/**
 * TODO: 0的时候不需要显示的问题,也就是要在格式中添加什么值不显示的标签
 * 考虑是否需要公式。一个 符号表示的是乘除。加上/表示转义。
 * 还需要公式。如果是公式的话还需要{{0}}//{{1}} 如果值是1，2.则表示1/2 {{0}}/{{1}}表示0.5
 */

/**
 * @description
 *  专门处理 Label 相关 的组件，如 ccLabel,ccRichText,ccEditBox
 *  可以使用模板化的方式将数据写入,可以处理字符串格式等
 *  todo 加入stringFormat 可以解析转换常见的字符串格式
 * @author MG
 * @date 2019-09-04
 * @export
 * @class VMLabel
 * @extends {VMBase}
 */
@ccclass
@executeInEditMode
@menu('ModelViewer/VM-Label(文本VM)')
export default class VMLabel extends VMBase {

    @property({
        readonly: true
    })
    private labelType: string = LABEL_TYPE.CC_LABEL;

    @property({
        type: [CCString],
        visible: function () {
            if (this.dynamicConfig == true) { return false }
            else {
                return true;
            }
        }
    })
    public watchPathArr: Array<string> = new Array<string>();

    protected templateValueArr: Array<any> = new Array<any>();

    private templateFormatArr: Array<string> = new Array<string>();

    private valueIndexArr: Array<number> = new Array<number>();

    private replaceStrArr: Array<string> = new Array<string>();

    private originText: string = null;

    onRestore() {
        this.checkLabelType();
    }

    onLoad() {
        if (this.dynamicConfig) {
            super.onLoad();
            this.checkLabelType();
            if (!EDITOR) {
                this.originText = this.getLabelValue()
                this.parseTemplate();
            }
        } else {
            super.onLoad();
            this.checkLabelType();
            if (!EDITOR) {
                this.originText = this.getLabelValue()
                this.parseTemplate();
            }
        }
    }

    //解析模板 获取初始格式化字符串格式 的信息
    parseTemplate() {
        let regexAll = /\{\{(.+?)\}\}/g; //匹配： 所有的{{value}}
        let regex = /\{\{(.+?)\}\}/;//匹配： {{value}} 中的 value
        let res = this.originText.match(regexAll);//匹配结果数组
        if (!!!res) return;
        for (let i = 0; i < res.length; i++) {
            const e = res[i];
            let arr = e.match(regex);
            let matchName = arr[1];
            let matchNameSplit = matchName.split(':');
            let matchInfo = matchNameSplit[1] || '';
            let valueIndex = matchNameSplit[0];
            this.replaceStrArr[i] = e;
            this.valueIndexArr[i] = parseInt(valueIndex || '0') || 0;
            this.templateFormatArr[i] = matchInfo;
        }
    }

    /**
     * @description 用templateValueArr的值替换originText的{{value}}
     * @date 2019-09-05
     * @returns 
     * @memberof VMLabel
     */
    getReplacedText() {
        let str = this.originText;//原始字符串模板 "name:{{0}} 或 name:{{0:fix2}}"
        for (let i = 0; i < this.valueIndexArr.length; ++i) {
            let valueIndex = this.valueIndexArr[i];
            let formatType = this.templateFormatArr[i];
            let value = this.templateValueArr[this.valueIndexArr[valueIndex]];
            let e = this.replaceStrArr[i];
            str = str.replace(e, this.getValueFromFormat(value, formatType));//从路径缓存值获取数据
        }
        return str;
    }

    /** 格式化字符串 */
    getValueFromFormat(value: number | string, format: string): string {
        return StringFormatFunction.deal(value, format);
    }

    /**初始化获取数据 */
    onValueInit() {
        //更新信息
        let length = this.watchPathArr.length;
        if (length > 0) {
            for (let i = 0; i < length; i++) {
                this.templateValueArr[i] = this.VM.getValue(this.watchPathArr[i], '?');
            }
            this.setLabelValue(this.getReplacedText()); // 重新解析
        }
    }

    /**监听数据发生了变动的情况 */
    onValueChanged(newValue, oldValue, pathArr: string[]) {

        let path = pathArr.join('.');
        //寻找缓存位置
        let index = this.watchPathArr.findIndex(v => v === path);

        if (index >= 0) {
            //如果是所属的路径，就可以替换文本了
            this.templateValueArr[index] = newValue; //缓存值
            this.setLabelValue(this.getReplacedText()); // 重新解析文本
        }
    }

    setLabelValue(value) {
        //@ts-ignore
        this.getComponent(this.labelType).string = value + '';
    }

    getLabelValue(): string {
        //@ts-ignore
        return this.getComponent(this.labelType).string;
    }

    /**
     * @description 检查label类型
     * @date 2019-09-05
     * @returns
     * @memberof VMLabel
     */
    checkLabelType() {
        for (let i in LABEL_TYPE) {
            let comp = this.node.getComponent(LABEL_TYPE[i]);
            if (comp) {
                this.labelType = LABEL_TYPE[i];
                return true;
            }
        }
        error('没有挂载任何label组件');
        return false;
    }

    addDynamicConfig(pathArr: string[]) {
        this.watchPathArr = this.watchPathArr.concat(pathArr);
        this.onLoad();
        this.enabled = true;
    }

}

