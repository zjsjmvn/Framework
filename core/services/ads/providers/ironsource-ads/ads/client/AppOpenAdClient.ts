
import { log } from "cc";
import { AppOpenAdLoadCallbackNTF, AppOpenAdFullScreenContentCallbackNTF, ShowAppOpenAdCompleteNTF, LoadAppOpenAdREQ, LoadAppOpenAdACK, IsAdAvailableREQ, IsAdAvailableACK, ShowAppOpenAdREQ as ShowAppOpenAdREQ, ShowAppOpenAdACK } from "../../proto/AppOpenAd";
import { OnShowAdCompleteListener } from "../listener/OnShowAdCompleteListener";
import { AdClient } from "./AdClient";
import { AppOpenAdListener } from "../listener/AppOpenAdListener";
import { AppOpenPaidEventNotification } from "../../proto/PaidEventNTF";
import { OnPaidEventListener } from "../listener/OnPaidEventListener";

/**
 * @zh
 * 开屏广告的 TS 端实现
 * @en
 * Implementing of app open ad.
 */
const module = "[AppOpenAdClient]";
export class AppOpenAdClient extends AdClient {

    /**
     * @zh
     * 开屏广告的事件接收器，多个类型的联合
     * @en
     * The listener of app open ad.
     */
    private _appOpenAdListener: AppOpenAdListener

    /**
     * @zh
     * 开屏广告的事件接收器，多个类型的联合
     * @en
     * The listener of app open ad.
     */
    set appOpenAdListener(value: AppOpenAdListener) {
        if (this._appOpenAdListener) {
            this.removeEventListener("AppOpenAdLoadCallbackNTF", this.onAppOpenAdLoadCallbackNTF, this);
            this.removeEventListener("AppOpenPaidEventNotification", this.onPaidEvent, this);
            this.removeEventListener("AppOpenAdFullScreenContentCallbackNTF", this.onFullScreenContentCallbackNTF, this);
            this.removeEventListener("ShowAppOpenAdCompleteNTF", this.onShowCompleteNTF, this);
        }

        this._appOpenAdListener = value;
        if (value) {
            this.addEventListener("AppOpenAdLoadCallbackNTF", this.onAppOpenAdLoadCallbackNTF, this);
            this.addEventListener("AppOpenPaidEventNotification", this.onPaidEvent, this);
            this.addEventListener("AppOpenAdFullScreenContentCallbackNTF", this.onFullScreenContentCallbackNTF, this);
            this.addEventListener("ShowAppOpenAdCompleteNTF", this.onShowCompleteNTF, this);
        }
    }

    /**
     * @zh
     * 开屏广告的事件接收器，多个类型的联合
     * @en
     * The listener of app open ad.
     */
    get appOpenAdListener(): AppOpenAdListener {
        return this._appOpenAdListener;
    }

    /**
     * @zh
     * 加载开屏广告
     * @en
     * load app open ad.
     * @param unitId 
     *  @zh 开屏广告的单元 Id
     *  @en the unit id of app open ad
     * @param appOpenAdListener 
     *  @zh 开屏广告监听器
     *  @en listener for app open ad
     */
    loadAd(unitId: string, appOpenAdListener?: AppOpenAdListener) {
        this.appOpenAdListener = appOpenAdListener;
        this.unitId = unitId;

        this.sendToNative("LoadAppOpenAdREQ", { unitId: unitId });
    }

    /**
     * @zh
     * 开屏广告是否有效
     * 要从回调中去判断是否有效，在安卓上，消息是来自其他线程的，因此是异步的。
     * @en
     * whether the app open ad is valid.
     * @param onComplete 
     * @param thisArg 
     */
    isValid(onComplete: (valid: boolean) => void, thisArg: any) {
        this.sendToNative("IsAdAvailableREQ", { unitId: this.unitId });

        // 监听响应事件
        this.addEventListener("IsAdAvailableACK", (ack: IsAdAvailableACK) => {
            log(module, "isValid", ack.valid);
            if (onComplete && thisArg) {
                onComplete.call(thisArg, ack.valid);
            }
        }, this);
    }

    /**
     * @zh
     *  显示开屏广告
     * @en
     *  Show app open ad.
     * @param onComplete 
     *  @zh 展示结束
     *  @en whether the show process is complete
     */
    show(onComplete?: () => void) {
        this.sendToNative("ShowAppOpenAdREQ", { unitId: this.unitId });

        // 监听响应事件
        this.addEventListener("ShowAppOpenAdACK", (ack: ShowAppOpenAdACK) => {
            log(module, "showAdIfAvailable", ack);
            if (onComplete) {
                onComplete();
            }
        }, this);
    }

    /**
     * @zh
     * 销毁开屏广告
     * 安卓中没有手动销毁的方法，这里的销毁是事件回调
     * @en
     * Destroy the app open ad
     * Note that there is no 'destroy' method on the app open ad.
     * Simply deregister all callbacks.
     */
    destroy() {
        if (this._appOpenAdListener) {
            this.removeEventListener("AppOpenAdLoadCallbackNTF", this.onAppOpenAdLoadCallbackNTF, this);
            this.removeEventListener("AppOpenPaidEventNotification", this.onPaidEvent, this);
            this.removeEventListener("AppOpenAdFullScreenContentCallbackNTF", this.onFullScreenContentCallbackNTF, this);
            this.removeEventListener("ShowAppOpenAdCompleteNTF", this.onShowCompleteNTF, this);
        }

        this._appOpenAdListener = null;
        super.destroy();
    }

    private onAppOpenAdLoadCallbackNTF = (ntf: AppOpenAdLoadCallbackNTF) => {
        if (this.appOpenAdListener) {
            let method = this.appOpenAdListener[ntf.method];
            if (method) {
                method(ntf.loadAdError);
            }
        }
    }

    private onFullScreenContentCallbackNTF = (ntf: AppOpenAdFullScreenContentCallbackNTF) => {
        if (ntf && ntf.method && this.appOpenAdListener) {
            let method = this.appOpenAdListener[ntf.method];
            if (method) {
                method(ntf.adError);
            }
        }
    }

    private onShowCompleteNTF = (ntf: ShowAppOpenAdCompleteNTF) => {
        const c = this.appOpenAdListener as OnShowAdCompleteListener;
        if (c && c.onShowAdComplete) {
            c.onShowAdComplete(ntf.unitId);
        }
    }

    private onPaidEvent = (ntf: AppOpenPaidEventNotification) => {
        const listener = this.appOpenAdListener as OnPaidEventListener<AppOpenPaidEventNotification>;
        if (listener && listener.onPaidEvent) {
            listener.onPaidEvent(ntf);
        }
    }
}
