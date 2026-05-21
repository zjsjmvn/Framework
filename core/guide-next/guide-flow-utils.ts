type GuideStepConfigLike = Record<string, any>;

type GuideFlowConfigLike = {
    stepDefaults?: Record<string, any>;
    steps: GuideStepConfigLike[];
};

/** 把流程级步骤默认值合并到单步配置中；步骤自身配置优先。 */
export function applyGuideStepDefaults<T extends GuideStepConfigLike>(step: T, defaults?: Record<string, any>): T {
    if (!defaults) {
        return step;
    }

    const merged: Record<string, any> = { ...defaults };
    const stepRecord = step as Record<string, any>;
    Object.keys(stepRecord).forEach((key) => {
        const value = stepRecord[key];
        if (value !== undefined) {
            merged[key] = value;
        }
    });

    return merged as T;
}

/** 规格化流程配置，让运行器只面对已经继承默认值后的步骤。 */
export function normalizeGuideFlowConfig<T extends GuideFlowConfigLike>(flow: T): T {
    if (!flow.stepDefaults) {
        return flow;
    }

    return {
        ...flow,
        steps: flow.steps.map((step) => applyGuideStepDefaults(step, flow.stepDefaults)),
    } as T;
}
