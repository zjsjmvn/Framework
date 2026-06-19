// 原生广告桥回调错误载荷类型，需与 native 侧 proto/事件 payload 保持字段一致。

import { AdError, LoadAdError } from "../ads/alias/TypeAlias";

export interface ILoadAdError {
    method?: string;
    loadAdError?: LoadAdError;
}

export interface IAdError {
    method?: string;
    adError?: AdError;
}
