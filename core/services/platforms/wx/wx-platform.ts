import { Texture2D } from 'cc';
import { ImageAsset } from 'cc';
import { SpriteFrame } from 'cc';
import { _decorator, Component, Node, view, director, Size, log, UITransform, screen, v3, math, isValid } from 'cc';
export enum WeChatAuthScope {
    userInfo,
    writePhotosAlbum
}

export default class WXPlatform {

    public static login(): Promise<{ errMsg: string, code: string }> {
        return new Promise((resolve, reject) => {
            wx.login({
                success: async (res: { errMsg: string, code: string }) => {
                    console.log('login success', res.errMsg, res.code);
                    resolve(res);
                }, fail: (res) => {
                    resolve(null);
                    console.log('login fail')
                }
            })
        })
    }
    // assetManager.loadRemote<ImageAsset>(udata.avatarUrl, { ext: '.jpg'}, function(err, imageAsset) {
    //     const sf = new SpriteFrame();
    //     const texture = new Texture2D();
    //     texture.image = imageAsset;
    //     sf.texture = texture;
    //     sp.spriteFrame = sf;
    // });
    public static loadAvatar(url: string, width: number = 100, height: number = 100): Promise<SpriteFrame> {
        return new Promise<SpriteFrame>((resolve, reject) => {
            const image = wx.createImage();
            image.src = url;
            image.width = width;
            image.height = height;
            image.onload = res => {
                console.log("wx load remote image success: ", res);
                let imageAsset = new ImageAsset(image);
                let texture = new Texture2D();
                texture.image = imageAsset;

                let spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                spriteFrame.packable = false;

                resolve(spriteFrame);
            }
            image.onerror = error => {
                console.log("wx load remote image error: ", error);
                reject(error);
            };
        });
    }


    /**
     * @description         WeChatPlatform.authUserInfo(button, (userInfo: { nickName: string, avatarUrl: string }) => {
                                    console.log('授权成功', userInfo);
                                }, () => {
                                    console.log('授权失败');
                                });
     * @static
     * @param {Node} posNode
     * @param {Function} success 如果参数是null,表示是授权过，不需要在授权了。
     * @param {Function} fail
     * @memberof WeChatPlatform
     */
    public static async authUserInfo(posNode: Node, success: Function, fail: Function) {
        let isAuthed = await this.isAuthed(WeChatAuthScope.userInfo);
        if (!isAuthed) {
            console.log("没认证过")
            let pos = posNode && this.convertToWxPos(posNode);
            //位置尺寸环境参数
            let left = 0;
            let top = 0;
            let width = 0;
            let height = 0;
            if (pos) {
                left = pos.left;
                top = pos.top;
                width = pos.width;
                height = pos.height;
            }
            let button = window["wx"].createUserInfoButton({
                type: 'image',
                image: '',
                style: {
                    left: left,
                    top: top,
                    width: width,
                    height: height,
                    lineHeight: 40,
                    borderColor: '#00000000',
                    borderWidth: 0,
                    backgroundColor: '#00000000',
                    color: '#00000000',
                    textAlign: 'center',
                    fontSize: 16,
                    borderRadius: 4
                }
            })
            button.onTap((res) => {
                if (isValid(button)) {
                    button.destroy();
                }
                if (res.userInfo) {
                    success && success(res.userInfo);
                } else {
                    console.log("授权失败" + res);
                    fail && fail();
                }
            })
        } else {
            wx.getUserInfo({
                success: function (res) {
                    console.log(res.userInfo)
                    success && success(res.userInfo);
                }
            })
        }
    }

    public static isAuthed(typ: WeChatAuthScope): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.getSetting(res => {
                if (!res.authSetting) {
                    resolve(false);
                }
                let scopeKey: string = null;
                switch (typ) {
                    case WeChatAuthScope.userInfo:
                        scopeKey = 'scope.userInfo'
                        break;
                    case WeChatAuthScope.writePhotosAlbum:
                        scopeKey = 'scope.writePhotosAlbum'
                        break;
                    default:
                        throw new Error(`WeChatUtil >> __Typ2AuthSettingKey: 未处理的授权类型 typ = ${typ}`);
                }
                let _isAuthed = res.authSetting[scopeKey]
                resolve(_isAuthed);
            }, () => {
                resolve(false);
            });
        });

    }
    private static getSetting(onCompleted: (res: any) => void, onFail: Function): void {
        window["wx"].getSetting({
            success(res) {
                onCompleted(res);
            },
            fail() {
                console.error("WeChatUtil >> Auth::getSetting failed.");
                onFail && onFail();
            }
        });
    }


    private static convertToWxPos(node?: Node): { left: number, top: number, width: number, height: number } {
        if (!node) return null;
        let leftDownPos = node.getComponent(UITransform).convertToWorldSpaceAR(v3(-node.getComponent(UITransform).width * node.getComponent(UITransform).anchorX, -node.getComponent(UITransform).height * node.getComponent(UITransform).anchorY, 0));
        let rightUpPos = node.getComponent(UITransform).convertToWorldSpaceAR(v3(node.getComponent(UITransform).width * (1 - node.getComponent(UITransform).anchorX), node.getComponent(UITransform).height * (1 - node.getComponent(UITransform).anchorY), 0));
        let frameSize = math.size(screen.windowSize.width / screen.devicePixelRatio, screen.windowSize.height / screen.devicePixelRatio);   // Wx View
        let visibleSize = view.getVisibleSize();  // Game View
        let left = leftDownPos.x / visibleSize.width * frameSize.width;
        let top = frameSize.height - (rightUpPos.y / visibleSize.height * frameSize.height);
        let width = (rightUpPos.x - leftDownPos.x) / visibleSize.width * frameSize.width;
        let height = (rightUpPos.y - leftDownPos.y) / visibleSize.height * frameSize.height;
        return { left, top, width, height };
    }

    private static replacenormalcharacter(normalcharacterstr: string) {
        return normalcharacterstr.replace(/\=/g, "~").replace(/\//g, "_").replace(/\+/g, "-");
    }

}
