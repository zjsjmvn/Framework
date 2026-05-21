/** 单个启动条件。ok=false 时 reason 会进入最终未启动原因。 */
export interface GuideStartCondition {
    ok: boolean;
    reason: string;
}

/** 引导业务层启动判断结果。 */
export interface GuideStartDecision {
    shouldStart: boolean;
    reasons: string[];
}

/** 从一组条件生成可解释的启动判断结果。 */
export function createGuideStartDecision(conditions: GuideStartCondition[]): GuideStartDecision {
    const reasons = conditions
        .filter((condition) => !condition.ok)
        .map((condition) => condition.reason)
        .filter((reason) => !!reason);

    return {
        shouldStart: reasons.length === 0,
        reasons,
    };
}

/** 格式化启动判断结果，方便业务层日志统一输出。 */
export function formatGuideStartDecision(guideId: string, decision: GuideStartDecision): string {
    if (decision.shouldStart) {
        return `${guideId} ready`;
    }

    const reasons = decision.reasons.length > 0 ? decision.reasons.join('; ') : 'unknown reason';
    return `${guideId} skipped: ${reasons}`;
}
