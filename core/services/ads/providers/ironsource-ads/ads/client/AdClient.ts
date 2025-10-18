
import { EventTarget } from "cc";
import { native } from "cc";

/**
 * 响应回调接口
 */
export interface INativeResponse<T = any> {
    (response: T): void;
}

/**
 * AdClient
 * @zh
 * 所有广告类型的基类
 * @en
 * Base class for all ads.
 */
export abstract class AdClient extends EventTarget {

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

            // 如果有响应回调，注册监听器
            if (onResponse && responseMethod) {
                // 创建一个包装器来处理 jsbBridgeWrapper 的回调参数
                const responseHandler = (data: string) => {
                    this.handleResponse(responseMethod, data);
                };
                this.responseListeners.set(responseMethod, { callback: onResponse, thisArg, handler: responseHandler });
                this.addEventListener(responseMethod, responseHandler, this);
            }

            native.jsbBridgeWrapper.dispatchEventToNative(method, content);
        }
    }

    /**
     * @zh
     * 处理响应回调
     * @en
     * Handle response callback
     */
    private handleResponse = (eventName: string, data: string): void => {
        console.log("handleResponse", eventName, data);

        // 查找对应的响应监听器
        const listener = this.responseListeners.get(eventName);
        if (listener) {
            try {
                // 解析 JSON 数据
                console.log("handleResponse2", data);
                const response = data ? JSON.parse(data) : {};

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
            native.jsbBridgeWrapper.addNativeEventListener(eventName, handler);
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
            native.jsbBridgeWrapper.removeNativeEventListener(eventName, handler);
        }
    }

    /**
     * @zh
     * 销毁客户端
     * @en
     * Destroy client
     */
    public destroy(): void {
        // 清理所有响应监听器
        for (const [method, listener] of this.responseListeners.entries()) {
            this.removeEventListener(method, listener.handler, this);
        }
        this.responseListeners.clear();

        // 子类实现具体销毁逻辑
    }
}