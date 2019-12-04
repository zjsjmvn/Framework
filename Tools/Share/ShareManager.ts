import { IShareProvider } from './Provider/IShareProvider';
export class ShareManager {
    /**
     * @description 单例
     * @private
     * @static
     * @type {ShareManager}
     * @memberof ShareManager
     */
    private static _instance: ShareManager = null

    public static get instance() {
        if (!ShareManager._instance) ShareManager._instance = new ShareManager();
        return ShareManager._instance;
    }

    private provider: IShareProvider = null;

    public addShareProvider(provider: IShareProvider) {
        this.provider = provider;
    }

    public share(title: string, image?: string): Promise<boolean> {
        try {
            if (!!this.provider) {
                let result = this.provider.share(title, image);
                return result;
            } else {
                throw new Error("There is no ShareProvider");
            }
        } catch (error) {
            console.log(error);
        }
    }


}