import { _decorator, Component, log, Node, sp, ValueType } from 'cc';
import { EDITOR } from "cc/env";
import UIKiller from './uikiller';
import { ExtendCCComponent } from '../components/extend-cc-component';
const { ccclass, property } = _decorator;
/**
 * @description 
 * 继承于Thor的组件会在运行时自动绑定节点
 * ### 绑定规则。
 * 被bindComponent绑定的组件，
 * - 自身会绑定触摸事件。为_onTouchStart,_onTouchMove,_onTouchEnd,_onTouchCancel。
 * - 其子所有子节点会绑定其node上。如下面节点层级结构，可以使用如下方式访问nodeA.nodeB.nodeC.nodeD。可以链式访问。
 * nodeA
 *  nodeB
 *   nodeC
 *    nodeD
 * - 特别的:
 *  - 如果子节点是下划线_开头，则会监听触摸事件。并且直接绑定到脚本上。可以使用脚本直接访问。
 *  - 如果子节点是下划线+名字+$+数字。如：_image$1，则为其绑定触摸事件。事件类型为           
 *          `_on${name}TouchStart`,
            `_on${name}TouchMove`,
            `_on${name}TouchEnd`,
            `_on${name}TouchCancel`,
      并且节点下添加$属性。$值为其后面的数字。   
 * @class Thor
 * @extends {Component}
 */
@ccclass
// @executeInEditMode
export default class Thor extends ExtendCCComponent {
    _binding: Boolean = false;
    _copyBindNodeName: boolean = false;
    @property({ displayName: "勾选拷贝绑定节点信息", tooltip: "勾选后自动存储在剪切板里。主要用于编辑器智能提示" })
    get copyBindNodeName() {
        return this._copyBindNodeName;
    }
    // @property
    set copyBindNodeName(val) {
        if (EDITOR) {
            this.bind();
            var text = '';
            try {
                let r = (node) => {
                    let comInfo = '';
                    for (const key2 in node) {
                        const val = node[key2];
                        // 绑定组件
                        if (val instanceof Component) {
                            let index = val.name.indexOf('<');
                            let name = val.name.slice(index + 1, -1);
                            if (comInfo !== '') {
                                comInfo += ', ';
                            }
                            if (sp[name] != undefined) {
                                comInfo += '$' + name + ': sp.' + name;
                            }
                            else {
                                comInfo += '$' + name + ': ' + name;
                            }
                        }
                        // 绑定节点
                        if (val instanceof Node
                            && key2 != '_parent'
                            && !/^[0-9]*$/.test(val.name[0])
                            && val.name.indexOf('New') != 0
                            // 中间没空格
                            && val.name.indexOf(' ') === -1
                            && val.name.indexOf('-') === -1) {
                            if (val.name.toLocaleLowerCase() == '_name' || val.name.indexOf(' ') !== -1) {
                                // 不能为_name
                                console.log('名字不能为 _name');
                            }
                            else {
                                if (comInfo !== '') {
                                    comInfo += ', ';
                                }
                                let nextChildInfo = r(val);
                                let childInfo = val.name + ': Node';
                                if (nextChildInfo.length > 0) {
                                    childInfo += ' & { ' + nextChildInfo + ' }';
                                }
                                comInfo += childInfo;
                            }
                        }
                    }
                    return comInfo;
                }
                var text = '';
                for (const key in this) {
                    const element = this[key];
                    if (element instanceof Node) {
                        let comInfo = '';
                        comInfo += r(element);
                        if (comInfo.length > 0) {
                            comInfo = ' & { ' + comInfo + ' }';
                        }
                        if (key.indexOf(' ') === -1 && key.indexOf('-') === -1) {
                            let accessModifier = key === '_touchSwallow' ? 'protected' : 'private';
                            text += 'public ' + ' ' + key + `: Node${comInfo};` + '\n';
                        }
                    }
                }
                var tag = document.createElement('textarea');
                tag.setAttribute('id', 'cp_hgz_input');
                tag.value = `    //#region uikiller\n ${text}    //#endregion\n`;
                document.getElementsByTagName('body')[0].appendChild(tag);
                // @ts-ignore
                document.getElementById('cp_hgz_input').select();
                document.execCommand('copy');
                document.getElementById('cp_hgz_input').remove();
                log(text)
                console.log('uiKiller 拷贝成功');
            } catch (error) {
                log(error);
            }
        }
    }

    __preload() {
        this.bind();
    }

    bind() {
        if (this._binding) {
            return;
        }
        this._binding = true;
        UIKiller.bind(this);
    }

}
window.Thor = Thor
