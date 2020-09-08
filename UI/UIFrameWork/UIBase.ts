import Thor from '../UIKiller/Thor';
const PREFAB_UI_DIR = 'prefab/ui/';

const { property, ccclass } = cc._decorator
/**
 * @description TODO: 考虑动画添加进来。但是动画可能有animation 也可能有action。考虑show的时候的问题。
 * @export
 * @abstract
 * @class UIBase
 * @extends {cc.Component}
 */
@ccclass
export default abstract class UIBase extends Thor {
    protected static prefabPath: string;
    /**
     * 得到prefab的路径，相对于resources目录
     */
    public static get PrefabPath(): string {
        if (!this.prefabPath) console.error('prefabPath is undefined')
        return PREFAB_UI_DIR + this.prefabPath;
    }

    /**
     * @description 是否需要缓存
     * @type {boolean}
     * @memberof UIBase
     */
    @property({ displayName: "此ui是否需要缓存", tooltip: "勾选后，ui会被ui管理器缓存。" })
    needCache: boolean = false;

    @property({ displayName: "此ui是否允许多个", tooltip: "勾选后，ui管理器不会处理重复此ui" })

    allowMultiThisUI: boolean = false;

    public init(...args) {

    }

    /**
     * @description 显示
     * @abstract
     * @memberof UIBase
     */
    public show() {
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





}
