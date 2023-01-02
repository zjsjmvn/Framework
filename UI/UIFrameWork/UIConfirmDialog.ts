import UIBase from './UIBase';
import { DialogParams } from './UIManager';
import { _decorator } from 'cc';

const { ccclass, menu, property } = _decorator;

@ccclass
@menu("UI/tips/UIConfirmDialog")
export default class UIConfirmDialog extends UIBase {
    protected static prefabUrl = "tips/confirmDialog";
    protected _title: string;
    protected _content: string;
    protected _okCallback: Function;
    protected _cancelCallback: Function;

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


    cancel() {
        this._cancelCallback && this._cancelCallback();
    }

    ok() {
        this._okCallback && this._okCallback();
    }
}