import { IAdProvider } from "../ads/providers/iad-provider";

export default abstract class BasePlatform {
    private adProviders: Array<IAdProvider>;
    init() {
        this.adProviders = new Array();
    }
    public addAdProvider(adProvider: IAdProvider) {
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