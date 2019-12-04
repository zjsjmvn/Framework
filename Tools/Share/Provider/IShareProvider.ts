export interface IShareProvider {



    /**
     * @description 分享
     * @param {string} title
     * @param {string} [image]
     * @memberof IShareProvider
     */
    share(title: string, image?: string): Promise<boolean>;

    /**
     * @description 初始化平台独有的特性。
     * @memberof IShareProvider
     */
    initSelfFeatures();
}