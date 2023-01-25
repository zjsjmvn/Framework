import { _decorator } from 'cc';
import Thor from '../ui-killer/Thor';
const PREFAB_UI_DIR = 'Prefab/UI/';

const { property, ccclass } = _decorator
/**
 * @description TODO: 考虑动画添加进来。但是动画可能有animation 也可能有action。考虑show的时候的问题。
 * @export
 * @abstract
 * @class UIBase
 * @extends {Component}
 */
@ccclass
export default abstract class UIBase extends Thor {


    /**
     * @description 是否需要缓存
     * @type {boolean}
     * @memberof UIBase
     */
    @property({ displayName: "此ui是否需要缓存", tooltip: "勾选后，ui会被ui管理器缓存。" })
    needCache: boolean = false;

    // @property({ displayName: "此ui是否允许多个", tooltip: "勾选后，ui管理器不会处理重复此ui" })
    // allowMany: boolean = false;

    public init(...args) {

    }

    /**
     * @description 显示
     * @abstract
     * @memberof UIBase
     */
    show() {
        this.node.active = true;
    }
    /**
     * @description 隐藏
     * @abstract
     * @memberof UIBase
     */
    public hide() {
        this.node.active = false;
    }

    /**
     * @description 关闭
     * @abstract
     * @memberof UIBase
     */
    public close() {
        this.node.destroy();
    }

    protected beforeShow(): Promise<void> {
        return new Promise(res => res());
    }

    protected afterShow() {

    }

    protected beforeClose(suspended: boolean): Promise<void> {
        return new Promise(res => res());
    }

    protected afterClose(suspended: boolean) {

    }

    protected onSuspended(): Promise<void> {
        return new Promise(res => res());
    }




}
