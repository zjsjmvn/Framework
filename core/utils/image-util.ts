import { _decorator, Component, Node, ImageAsset, assetManager, SpriteFrame, Texture2D, Sprite, Widget } from 'cc';
const { ccclass, property } = _decorator;

export class ImageUtil {
    @property({ type: Sprite })
    sp: Sprite = null;

    public static whiteBase64src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGUlEQVQYlWP8fwY8gAmf5DBRwMDAAAAbbgQMbCH2PAAAAABJRU5ErkJggg==';
    public static createSpriteFrameWithBase64(url: string, base64Src: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const that = this
            img.onload = function (info) {
                const imageAsset = that.createImageAsset(url, img);
                const spf = that.createSpriteFrameWithImageAsset(imageAsset);
                resolve(spf);
            };
            img.onerror = () => {
                reject(null);
            };
            img.src = base64Src;
        });
    }

    public static createImageAsset(url: string, img: HTMLImageElement): ImageAsset {
        const imgAsset = new ImageAsset(img);
        imgAsset._uuid = url;
        assetManager.assets.add(imgAsset._uuid, imgAsset);
        imgAsset._nativeUrl = imgAsset._uuid;
        assetManager.dependUtil._depends.add(imgAsset._uuid, { deps: [], nativeDep: [] });

        return imgAsset;
    }
    public static createTexture2DWithImageAsset(imgAsset: ImageAsset): Texture2D {
        const texture = new Texture2D();
        texture.image = imgAsset;
        //@ts-ignore
        texture._uuid = "bbbbbb";
        //@ts-ignore
        texture._nativeUrl = '';
        //@ts-ignore
        assetManager.assets.add(texture._uuid, texture);
        assetManager.dependUtil._depends.add(texture._uuid, { deps: [imgAsset._uuid], nativeDep: [] });

        return texture;
    }
    public static createSpriteFrameWithImageAsset(imgAsset: ImageAsset): SpriteFrame {
        const texture = this.createTexture2DWithImageAsset(imgAsset);
        const spf = new SpriteFrame();
        spf.texture = texture;
        spf._uuid = "aaaaa";
        spf._nativeUrl = '';
        assetManager.assets.add(spf._uuid, spf);
        assetManager.dependUtil._depends.add(spf._uuid, { deps: [texture._uuid], nativeDep: [] });

        return spf;
    }


    /**
     * @description 通过图片url创建SpriteFrame
     *         

     *  圆角头像
        let url = 'http://localhost:7457/assets/game/native/45/459f34e7-efd8-49a1-aac0-fc50627d1287.jpeg'
        ImageUtil.create(url, 100, 100, (data: any, width: number, height: number) => {
            let radius = (width < height ? width : height) / 2 - 0.5;
            let hWidth = (width - 1) / 2;
            let hHeight = (height - 1) / 2;
            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) {
                    let dis = Math.sqrt((i - hHeight) * (i - hHeight) + (j - hWidth) * (j - hWidth));
                    if (dis / radius > 0.96)
                        data[(i * width + j) * 4 + 3] = (1.0 - 50.0 * Math.sin(dis / radius - 0.96)) * 255;
                }
            }
            Init.avatarOpacityCacheData.forEach((value, key) => {
                data[key] = value;
            });

        }, (sp) => {
            log("create success", sp)
            this.sprite.spriteFrame = sp;
        })
     * @static
     * @param {string} url  网络图片url
     * @param {number} height 图片高度
     * @param {number} width  图片宽度
     * @param {Function} frag 图片处理函数
     * @param {Function} callback 回调函数
     * @memberof ImageUtil
     */
    public static create(url: string, height: number, width: number, frag: Function, callback: Function) {
        let img = new Image();
        img.onload = function () {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            // 将图片绘制到画布上
            canvas.width = width;
            canvas.height = height
            ctx.drawImage(img, 0, 0, width, height);
            // 获取像素数据
            let pixels = ctx.getImageData(0, 0, width, height).data;
            if (frag) frag(pixels, img.width, img.height);
            // 创建一个新的ImageData对象
            // let imageData = new ImageData(pixels, img.width, img.height);
            let imageData = ctx.createImageData(width, height);
            imageData.data.set(pixels);
            // for (let i = 0; i < pixels.length; i++) {
            //     imageData.data[i] = pixels[i];
            // }
            ctx.putImageData(imageData, 0, 0);
            let asset = new ImageAsset(canvas);
            let spriteFrame = SpriteFrame.createWithImage(asset);
            return callback(spriteFrame);
        }
        img.src = url;
    }

}
