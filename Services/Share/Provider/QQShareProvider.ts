import { IShareProvider } from './IShareProvider';
export default class QQShareProvider implements IShareProvider {

    private defaultShareTitle: string = null;
    private defaultShareImage: string = null;

    initSelfFeatures() {
        //显示右上角...转发
        window.qq.showShareMenu({
            withShareTicket: true
        });


        let imageUrl = null;
        if (this.defaultShareImage) {
            imageUrl = url.raw(this.defaultShareImage);
            if (assetManager.md5Pipe) {
                imageUrl = assetManager.md5Pipe.transformURL(imageUrl);
            }
        }

        window.qq.onShareAppMessage(() => ({
            title: this.defaultShareTitle,
            imageUrl: imageUrl,
        }));
    }

    public constructor(defaultShareTitle?: string, defaultShareImage?: string) {
        // 初始化一些qq上需要的东西。

        console.log("初始化qq分享")
        if (!!window.qq) {

            this.defaultShareTitle = defaultShareTitle;
            this.defaultShareImage = defaultShareImage;
            this.initSelfFeatures();
        } else {
            throw new Error("注意非qq平台，却使用QQShareProvider。");
        }
    }

    public share(title: string, image?: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let successFunc = () => {
                console.log("分享成功");
                resolve(true);
            }
            let failFunc = () => {
                console.log("分享失败");
                resolve(false);
            }
            let imageUrl = null;
            if (image) {
                imageUrl = url.raw(image);
                if (assetManager.md5Pipe) {
                    imageUrl = assetManager.md5Pipe.transformURL(imageUrl);
                }
            }
            console.log('url', imageUrl);
            window.qq.shareAppMessage({
                title: title,
                imageUrl: imageUrl,
                success: successFunc,
                fail: failFunc,
            });
        })

    }
}