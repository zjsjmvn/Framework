
import { AdError } from "../alias/TypeAlias";

/**
 * 全屏广告展示阶段回调。
 *
 * 插屏和激励展示后都会进入全屏生命周期，因此共用这一组能力。
 */
export interface AdFullScreenListener {
    /** 广告被点击。 */
    onAdClicked?: () => void;
    /** 广告关闭，业务可在这里恢复游戏流程。 */
    onAdDismissedFullScreenContent?: () => void;
    /** 广告展示失败，参数是 Java 层透传的错误描述。 */
    onAdFailedToShowFullScreenContent?: (adError: AdError) => void;
    /** 广告产生展示曝光。 */
    onAdImpression?: () => void;
    /** 广告已经进入全屏展示。 */
    onAdShowedFullScreenContent?: () => void;
}
