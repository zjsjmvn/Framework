import UIKiller from "./uikiller";
import Utils from '../../Utils/Utils';
import { _decorator, Component, log } from 'cc';
import { EDITOR } from "cc/env";
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
export default class Thor extends Component {

    protected useController: Boolean = false;
    protected controllerName: String = '';
    _binding: Boolean = false;
    $controller: Object = null;

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
                // 读取node上绑定的节点信息，node上绑定的是所有子节点和下划线开头的节点。   
                for (const key in this.node) {
                    const element = this.node[key];
                    if (element instanceof Node) {
                        let comInfo = '';
                        for (const key$ in element) {
                            const val = element[key$];
                            if (key$[0] == '$' && val instanceof Component) {
                                log('val', key$[0], val.name)

                                let index = val.name.indexOf('<');
                                let name = val.name.slice(index + 1, -1);
                                if (cc[name] != undefined && Utils.isValidVariableName(name)) {
                                    comInfo += '$' + name + ':' + name + ',';
                                }
                                else {
                                    comInfo += '$' + name + ':any,';
                                }
                            }
                        }
                        if (comInfo.length > 0) {
                            comInfo = '&{' + comInfo + '}';
                        }
                        if (Utils.isValidVariableName(key)) {
                            text += '\n\t' + key + `: Node${comInfo};` + '\n';
                        }
                    }
                }
                if (text.length > 0) {
                    text = `node:Node &{${text}};`
                }
                // 读取脚本上绑定的node，脚本上绑定的是下划线开头的节点。
                for (const key in this) {
                    const element = this[key];
                    // log('key', key)

                    if (key[0] == '_' && element instanceof Node) {
                        let comInfo = '';
                        for (const key$ in element) {
                            const val = element[key$];

                            if (key$[0] == '$' && val instanceof Component) {
                                // log('val', key, key$, val.name, val instanceof Component)

                                let index = val.name.indexOf('<');
                                let name = val.name.slice(index + 1, -1);

                                if (cc[name] != undefined) {
                                    comInfo += '$' + name + ':' + name + ',';
                                }
                                else {
                                    comInfo += '$' + name + ':any,';
                                }
                            }
                        }

                        element.children.forEach(element => {
                            if (element instanceof Node) {
                                if (Utils.isValidVariableName(element.name)) {
                                    log('element', element.name)
                                    comInfo += element.name + ':Node,';
                                }
                            }
                        });

                        if (comInfo.length > 0) {
                            comInfo = '&{' + comInfo + '}';
                        }
                        text += '\n\t' + key + `: Node${comInfo};` + '\n';

                    }
                }


            } catch (error) {
                log(error);
            }


            log("text");

            log("text", text);
            var tag = document.createElement('input');
            tag.setAttribute('id', 'cp_hgz_input');
            tag.value = text;
            document.getElementsByTagName('body')[0].appendChild(tag);
            document.getElementById('cp_hgz_input').select();
            document.execCommand('copy');
            document.getElementById('cp_hgz_input').remove();
        }
    }

    __preload() {
        this.bind();
    }

    getOptions() {
        return {
            debug: false
        }
    }

    bind() {
        if (this._binding) {
            return;
        }
        this._binding = true;
        let start = Date.now();
        let options = this.getOptions();
        UIKiller.bindComponent(this, options);
    }


    getChildNode(name): Node {
        return this[name];
    }
}
window.Thor = Thor


// function isValidVariableName(str) {
//     if (typeof str !== 'string') {
//         return false;
//     }
//     if (str.trim() !== str) {
//         return false;
//     }
//     try {
//         new Function(str, 'var ' + str);
//     } catch (_) {
//         return false;
//     }
//     return true;
// }

// log(isValidVariableName('New Label'))