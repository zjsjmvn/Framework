
import { LoadAdError } from "../alias/TypeAlias";

/**
 * 广告加载阶段回调。
 *
 * Banner、插屏、激励都会先走加载流程，因此共用这一组能力。
 */
export interface AdLoadListener {
    /** 广告加载成功，后续可以展示。 */
    onAdLoaded?: () => void;
    /** 广告加载失败，参数是 Java 层透传的错误描述。 */
    onAdFailedToLoad?: (loadError: LoadAdError) => void;
}
