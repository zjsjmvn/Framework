import { IAdProvider } from "../ads/providers/iad-provider";

/** 平台基类，维护当前平台可用的广告 provider 列表。 */
export default abstract class BasePlatform {
    private adProviders: Array<IAdProvider>;
    init() {
        this.adProviders = new Array();
    }
    public addAdProvider(adProvider: IAdProvider) {
        // 同一个 provider 实例只注册一次，避免广告展示时重复派发。
        let index = this.adProviders.findIndex((item) => {
            return item == adProvider;
        });
        if (-1 == index) {
            this.adProviders.push(adProvider);
        }
        return this;
    }
    public removeAdProvider(providerName: string) {

    }


}
