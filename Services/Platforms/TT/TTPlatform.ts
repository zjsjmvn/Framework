import { IAdProvider } from '../../Ads/Provider/IAdProvider';
import BasePlatform from '../BasePlatform';
import { TTCanIUse, TT_onTouchEnd } from './TTDecorators';
export default class TTPlatform extends BasePlatform {

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



    /**
     * @description  长震动
     * @memberof TTPlatform
     */
    @TTCanIUse
    public vibrateLong() {
        tt.vibrateLong(null);
    }

    /**
     * @description 短震动
     * @memberof TTPlatform
     */
    @TTCanIUse
    public vibrateShort() {
        tt?.vibrateShort(null);
    }

    /**
     * @description 可以将小游戏快捷方式添加到手机桌面上。
     * @memberof TTPlatform
     */
    @TT_onTouchEnd
    @TTCanIUse
    public static addShortcut(callback) {
        tt.addShortcut({
            success() {
                console.log("添加桌面成功");
                callback && callback(0);
            },
            fail(err) {
                console.log("添加桌面失败", err.errMsg);
                callback && callback(-1)
            },
        });
    }


    /**
     * @description 检查快捷方式
     * @param {(res: { status: { exist: boolean, needUpdate: boolean }, errMsg: string }) => void} successCallback
     * @param {({ errMsg: string }) => void} failCallback
     * @memberof TTPlatform
     */
    public static checkShortcut(successCallback: (res: { status: { exist: boolean, needUpdate: boolean }, errMsg: string }) => void, failCallback: ({ errMsg: string }) => void) {
        tt.checkShortcut({
            success(res) {
                console.log("检查快捷方式", res.status);
                successCallback && successCallback(res)
            },
            fail(res) {
                console.log("检查快捷方式失败", res.errMsg);
                failCallback && failCallback(res);
            },
        });
    }


    /**
     * @description 收藏小程序
     * @memberof TTPlatform
     */
    @TTCanIUse
    public static showFavoriteGuide(callback) {
        tt?.showFavoriteGuide({
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


}

// let t = new TTPlatform();
// t.addShortcut();
