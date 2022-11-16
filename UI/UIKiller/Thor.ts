import UIKiller from "./uikiller";
import Utils from '../../Utils/Utils';
const { ccclass, property } = cc._decorator;
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
 * @extends {cc.Component}
 */
@ccclass
// @executeInEditMode
export default class Thor extends cc.Component {

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

        if (CC_EDITOR) {
            this.bind();
            var text = '';


            try {
                // 读取node上绑定的节点信息，node上绑定的是所有子节点和下划线开头的节点。   
                for (const key in this.node) {
                    const element = this.node[key];
                    if (element instanceof cc.Node) {
                        let comInfo = '';
                        for (const key$ in element) {
                            const val = element[key$];
                            if (key$[0] == '$' && val instanceof cc.Component) {
                                cc.log('val', key$[0], val.name)

                                let index = val.name.indexOf('<');
                                let name = val.name.slice(index + 1, -1);
                                if (cc[name] != undefined && Utils.isValidVariableName(name)) {
                                    comInfo += '$' + name + ':cc.' + name + ',';
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
                            text += '\n\t' + key + `: cc.Node${comInfo};` + '\n';
                        }
                    }
                }
                if (text.length > 0) {
                    text = `node:cc.Node &{${text}};`
                }
                // 读取脚本上绑定的node，脚本上绑定的是下划线开头的节点。
                for (const key in this) {
                    const element = this[key];
                    // cc.log('key', key)

                    if (key[0] == '_' && element instanceof cc.Node) {
                        let comInfo = '';
                        for (const key$ in element) {
                            const val = element[key$];

                            if (key$[0] == '$' && val instanceof cc.Component) {
                                // cc.log('val', key, key$, val.name, val instanceof cc.Component)

                                let index = val.name.indexOf('<');
                                let name = val.name.slice(index + 1, -1);

                                if (cc[name] != undefined) {
                                    comInfo += '$' + name + ':cc.' + name + ',';
                                }
                                else {
                                    comInfo += '$' + name + ':any,';
                                }
                            }
                        }

                        element.children.forEach(element => {
                            if (element instanceof cc.Node) {
                                if (Utils.isValidVariableName(element.name)) {
                                    cc.log('element', element.name)
                                    comInfo += element.name + ':cc.Node,';
                                }
                            }
                        });

                        if (comInfo.length > 0) {
                            comInfo = '&{' + comInfo + '}';
                        }
                        text += '\n\t' + key + `: cc.Node${comInfo};` + '\n';

                    }
                }


            } catch (error) {
                cc.log(error);
            }


            cc.log("text");

            cc.log("text", text);
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

        if (CC_DEBUG) {
            let duration = Date.now() - start;
            // cc.log(`bindComponent ${this.node.name} duration ${duration}`);
        }
    }


    getChildNode(name): cc.Node {
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

// cc.log(isValidVariableName('New Label'))