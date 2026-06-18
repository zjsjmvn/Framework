import UIBase from './ui-base';

/** tips 弹窗数据基类。 */
export class UITipData {
}


/** tips UI 基类，继承 UIBase，具体展示逻辑由业务 tips 实现。 */
export default abstract class UITips<T extends UITipData> extends UIBase {




}
