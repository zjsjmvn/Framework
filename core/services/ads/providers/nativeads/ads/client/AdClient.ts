
import { EventTarget, log, warn } from "cc";
import { native } from "cc";

/**
 * 响应回调接口
 */
export interface INativeResponse<T = any> {
    (response: T): void;
}

/**
 * Java 广告桥事件名，必须和 Android libads 的 AdsEvents 保持一致。
 */
export const NativeAdsEvents = {
    READY: "Ads.ready",
    Banner: {
        LOAD: "Ads.banner.load",
        SHOW: "Ads.banner.show",
        DESTROY: "Ads.banner.destroy",
        EVENT: "Ads.banner.event",
        PAID: "Ads.banner.paid",
    },
    Interstitial: {
        LOAD: "Ads.interstitial.load",
        SHOW: "Ads.interstitial.show",
        EVENT: "Ads.interstitial.event",
        PAID: "Ads.interstitial.paid",
    },
    Rewarded: {
        LOAD: "Ads.rewarded.load",
        SHOW: "Ads.rewarded.show",
        EVENT: "Ads.rewarded.event",
        REWARD: "Ads.rewarded.reward",
        PAID: "Ads.rewarded.paid",
    },
};

/**
 * Java 侧通用状态值，TS 在这里映射回现有 listener 方法。
 */
export const NativeAdsStatus = {
    LOADED: "loaded",
    LOAD_FAILED: "load_failed",
    SHOWN: "shown",
    SHOW_FAILED: "show_failed",
    CLICKED: "clicked",
    DISMISSED: "dismissed",
    IMPRESSION: "impression",
    RENDER_FAILED: "render_failed",
    CLOSED: "closed",
    DESTROYED: "destroyed",
    VIDEO_COMPLETED: "video_completed",
    VIDEO_ERROR: "video_error",
    SKIPPED: "skipped",
};

/**
 * JSB 收到的 payload 可能是 JSON 字符串，也可能已经是对象；这里统一成对象。
 */
export function parseNativePayload<T>(payload: any): T {
    if (typeof payload === "string") {
        return payload ? JSON.parse(payload) as T : {} as T;
    }
    return (payload || {}) as T;
}

/**
 * AdClient
 * @zh
 * 所有广告类型的基类
 * @en
 * Base class for all ads.
 */
export abstract class AdClient extends EventTarget {
    private static readonly logTag = "[NativeAdsAdClient]";

    /**
     * @zh
     * 广告单元 Id
     * @en
     * The unit Id 
     */
    unitId: string;

    /**
     * @zh
     * 响应监听器映射
     * @en
     * Response listener mapping
     */
    private responseListeners: Map<string, { callback: INativeResponse, thisArg?: any, handler: (data: string) => void }> = new Map();

    /**
     * @zh
     * 构造函数
     * @en
     * Constructor
     */
    constructor(unitId: string) {
        super();
        this.unitId = unitId;
        log(AdClient.logTag, `create, unitId=${unitId || ""}`);
    }

    /**
     * @zh
     * 发送消息到原生，支持响应回调
     * @en
     * Send message to native with response callback
     */
    protected sendToNative<T>(method: string, data?: T, responseMethod?: string, onResponse?: INativeResponse, thisArg?: any): void {
        if (native && native.jsbBridgeWrapper) {
            const content = data ? JSON.stringify(data) : "";
            log(AdClient.logTag, `sendToNative, method=${method}, unitId=${this.unitId || ""}, responseMethod=${responseMethod || ""}, content=${content}`);

            // 如果有响应回调，注册监听器
            if (onResponse && responseMethod) {
                // 创建一个包装器来处理 jsbBridgeWrapper 的回调参数
                const responseHandler = (data: string) => {
                    this.handleResponse(responseMethod, data);
                };
                this.responseListeners.set(responseMethod, { callback: onResponse, thisArg, handler: responseHandler });
                this.addEventListener(responseMethod, responseHandler, this);
                log(AdClient.logTag, `register response listener, event=${responseMethod}, count=${this.responseListeners.size}`);
            }

            native.jsbBridgeWrapper.dispatchEventToNative(method, content);
        } else {
            warn(AdClient.logTag, `sendToNative skipped, jsbBridgeWrapper missing, method=${method}, unitId=${this.unitId || ""}`);
        }
    }

    /**
     * @zh
     * 处理响应回调
     * @en
     * Handle response callback
     */
    private handleResponse = (eventName: string, data: string): void => {
        log(AdClient.logTag, `handleResponse, event=${eventName}, unitId=${this.unitId || ""}, data=${data || ""}`);

        // 查找对应的响应监听器
        const listener = this.responseListeners.get(eventName);
        if (listener) {
            try {
                // 解析 JSON 数据
                const response = data ? JSON.parse(data) : {};
                log(AdClient.logTag, `handleResponse parsed, event=${eventName}`);

                if (listener.thisArg) {
                    listener.callback.call(listener.thisArg, response);
                } else {
                    listener.callback(response);
                }
            } catch (error) {
                console.error("Failed to parse response data:", error, data);
                // 如果解析失败，直接传递原始数据
                if (listener.thisArg) {
                    listener.callback.call(listener.thisArg, { error: "Parse failed", raw: data });
                } else {
                    listener.callback({ error: "Parse failed", raw: data });
                }
            }

            // 移除监听器（一次性使用）
            this.removeEventListener(eventName, listener.handler, this);
            this.responseListeners.delete(eventName);
            log(AdClient.logTag, `response listener removed, event=${eventName}, count=${this.responseListeners.size}`);
        } else {
            warn(AdClient.logTag, `handleResponse ignored, listener not found, event=${eventName}, unitId=${this.unitId || ""}`);
        }
    };

    /**
     * @zh
     * 添加事件监听器
     * @en
     * Add event listener
     */
    protected addEventListener(eventName: string, handler: (...args: any[]) => void, thisArg?: any): void {
        if (native && native.jsbBridgeWrapper) {
            log(AdClient.logTag, `addEventListener, event=${eventName}, unitId=${this.unitId || ""}`);
            native.jsbBridgeWrapper.addNativeEventListener(eventName, handler);
        } else {
            warn(AdClient.logTag, `addEventListener skipped, jsbBridgeWrapper missing, event=${eventName}, unitId=${this.unitId || ""}`);
        }
    }

    /**
     * @zh
     * 移除事件监听器
     * @en
     * Remove event listener
     */
    protected removeEventListener(eventName: string, handler: (...args: any[]) => void, thisArg?: any): void {
        if (native && native.jsbBridgeWrapper) {
            log(AdClient.logTag, `removeEventListener, event=${eventName}, unitId=${this.unitId || ""}`);
            native.jsbBridgeWrapper.removeNativeEventListener(eventName, handler);
        } else {
            warn(AdClient.logTag, `removeEventListener skipped, jsbBridgeWrapper missing, event=${eventName}, unitId=${this.unitId || ""}`);
        }
    }

    /**
     * @zh
     * 销毁客户端
     * @en
     * Destroy client
     */
    public destroy(): void {
        log(AdClient.logTag, `destroy, unitId=${this.unitId || ""}, responseListenerCount=${this.responseListeners.size}`);
        // 清理所有响应监听器
        for (const [method, listener] of this.responseListeners.entries()) {
            this.removeEventListener(method, listener.handler, this);
        }
        this.responseListeners.clear();

        // 子类实现具体销毁逻辑
    }
}
