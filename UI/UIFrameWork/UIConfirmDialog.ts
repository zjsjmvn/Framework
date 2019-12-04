import UIBase from './UIBase';
import { DialogParams } from './UIManager';

const { ccclass, menu, property } = cc._decorator;

@ccclass
@menu("UI/tips/UIConfirmDialog")
export default class UIConfirmDialog extends UIBase {
    protected static prefabUrl = "tips/confirmDialog";
    private _title: string;
    private _content: string;
    private _okCallback: Function;
    private _cancelCallback: Function;

    init(...args) {
        let data = args[0] as DialogParams;
        if (!!data) {
            this._title = data.title;
            this._content = data.content;
            this._okCallback = data.okCallback;
            this._cancelCallback = data.cancelCallback;
        } else {
            console.error('解析参数失败');
        }

    }

    public show() {

    }
    public hide() {

    }
    public close() {

    }

    cancel() {
        this._cancelCallback && this._cancelCallback();
    }

    ok() {
        this._okCallback && this._okCallback();
    }
}