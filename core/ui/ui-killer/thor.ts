import { _decorator, log } from 'cc';
import { EDITOR } from "cc/env";
import UIKiller from './uikiller';
import { ExtendCCComponent } from '../components/extend-cc-component';
import ThorBindExporter from './thor-bind-exporter';
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
 *  - 如果子节点是下划线_开头，则会监听触摸事件。如： _ABC,则会自动绑定脚本种的  _onABCTouchStart,_onABCTouchMove,_onABCTouchEnd,_onABCTouchCancel。直接绑定到脚本上。点击时会调用这些方法，如果没有则不调用。
 *  - 如果子节点是下划线+名字+$+数字。如：_image$1，则为其绑定触摸事件。事件类型为           
 *          `_on${name}TouchStart`,
            `_on${name}TouchMove`,
            `_on${name}TouchEnd`,
            `_on${name}TouchCancel`,
      并且节点下添加$属性。$值为其后面的数字,可通过node.$得到。   
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
    // @property 如果不生效了，就复制到其他脚本的onload里然后浏览器调试即可。
    set copyBindNodeName(val) {
        this._copyBindNodeName = val;
        if (!val) {
            return;
        }
        const text = this.exportBindNodeName();
        log(text);
        if (EDITOR) {
            try {
                if (typeof document === "undefined") {
                    return;
                }
                var tag = document.createElement('textarea');
                tag.setAttribute('id', 'cp_hgz_input');
                tag.value = text;
                document.getElementsByTagName('body')[0].appendChild(tag);
                // @ts-ignore
                document.getElementById('cp_hgz_input').select();
                document.execCommand('copy');
                document.getElementById('cp_hgz_input').remove();
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
        // console.time('bind');
        UIKiller.bind(this);
        // console.timeEnd('bind');
    }

    public exportBindNodeName(): string {
        this.bind();
        return ThorBindExporter.exportComponent(this);
    }

}
window.Thor = Thor
