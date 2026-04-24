
import { PaidEventNTF } from "../../proto/PaidEventNTF";

/**
 * 广告展示价值回调。
 *
 * Java 层在拿到聚合 eCPM 后会派发 paid 事件，TS 侧通过这里交给业务统计。
 */
export interface AdPaidListener<T extends PaidEventNTF> {
    /** 本次展示的价值、币种和广告源信息。 */
    onPaidEvent?: (paidNTF: T) => void;
}
