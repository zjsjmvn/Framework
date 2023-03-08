export class PlatformUtil {
    static get IsIOS(): boolean { return cc.sys.platform == cc.sys.IPHONE || cc.sys.platform == cc.sys.IPAD; }
    static get IsWechat(): boolean { return cc.sys.platform === cc.sys.WECHAT_GAME; }

    static OpenAppStore(appId: string): void {
        if (this.IsIOS) {
            cc.sys.openURL(`itms-apps://itunes.apple.com/app/id${appId}`)
        }
    }
}