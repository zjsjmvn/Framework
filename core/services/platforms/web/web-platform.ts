import { SpriteFrame } from "cc";
import PlatformService from "../platform-service";
import { ImageAsset } from "cc";
import { assetManager } from "cc";
import { Texture2D } from "cc";

export default class WebPlatform extends PlatformService {
    public async initPlatform() {
        console.log("WebPlatform.initPlatform");
    }










    public static loadAvatar(avatarUrl: string): Promise<SpriteFrame | null> {
        return new Promise((resolve) => {
            if (!avatarUrl || typeof avatarUrl !== 'string' || avatarUrl.trim() === '') {
                console.error('头像地址为空或无效');
                resolve(null);
                return;
            }

            // 使用 assetManager.loadRemote 加载远程图片
            assetManager.loadRemote<ImageAsset>(avatarUrl, { ext: '.jpg' }, (err, imageAsset) => {
                if (err) {
                    console.error(`加载头像失败 path= ${avatarUrl} err= ${err}`);
                    resolve(null); // 如果加载失败，返回 null
                    return;
                }

                try {
                    // 创建 Texture2D 并设置 imageAsset
                    const texture = new Texture2D();
                    texture.image = imageAsset;

                    // 创建 SpriteFrame 并设置 texture
                    const spriteFrame = new SpriteFrame();
                    spriteFrame.texture = texture;

                    // 返回 SpriteFrame
                    resolve(spriteFrame);
                } catch (error) {
                    console.error('创建纹理或精灵帧失败', error);
                    resolve(null);
                }
            });
        });
    }



}