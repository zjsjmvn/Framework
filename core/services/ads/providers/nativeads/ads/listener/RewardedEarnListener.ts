
/**
 * 激励广告发奖回调。
 *
 * 只有 Java 层收到 SDK 奖励校验通过事件后，才会触发这里。
 */
export interface RewardedEarnListener {
    /** 业务发放奖励，rewardType 和 amount 来自 Java 层 payload。 */
    onEarn?: (rewardType: string, amount: number) => void;
}
