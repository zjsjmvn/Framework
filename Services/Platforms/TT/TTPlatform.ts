import { IAdProvider } from '../../Ads/Provider/IAdvertiser';
import BasePlatform from '../BasePlatform';
export default class TTPlatform extends BasePlatform {

    private

    init() {
        super.init();
        // 添加默认的广告provider
    }

    // public addAdProvider(adProvider: IAdProvider) {
    //     super.addAdProvider(adProvider);
    //     return this;
    // }
    // public removeAdProvider(providerName: string) {
    // }


    /** 长震动 */
    public vibrateLong() {
        if (window['tt'] && window['tt'].vibrateShort) {
            window['tt'].vibrateLong();
        }
    }

    /** 短震动 */
    public vibrateShort() {
        if (window['tt'] && window['tt'].vibrateShort) {
            window['tt'].vibrateShort();
        }
    }

    /**
     * @description 收藏小程序
     * @memberof TTPlatform
     */
    public showFavoriteGuide(callback) {
        window['tt']?.showFavoriteGuide({
            type: "bar",
            content: "一键添加到我的小程序",
            position: "bottom",
            success(res) {
                console.log("引导组件展示成功");
                callback && callback(0);
            },
            fail(res) {
                console.log("引导组件展示失败");
                callback && callback(-1);
            },
        });
    }

    public static canIUse(schema: string) {
        return window['tt']?.canIUse(schema);
    }

}

