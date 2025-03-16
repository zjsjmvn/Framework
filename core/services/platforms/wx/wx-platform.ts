import { Texture2D } from 'cc';
import { assetManager } from 'cc';
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
    // public static loadAvatar(url: string, width: number = 100, height: number = 100): Promise<SpriteFrame> {
    //     return new Promise<SpriteFrame>((resolve, reject) => {
    //         const image = wx.createImage();
    //         image.src = url;
    //         image.width = width;
    //         image.height = height;
    //         image.onload = res => {
    //             console.log("wx load remote image success: ", res);
    //             let imageAsset = new ImageAsset(image);
    //             let texture = new Texture2D();
    //             texture.image = imageAsset;

    //             let spriteFrame = new SpriteFrame();
    //             spriteFrame.texture = texture;
    //             spriteFrame.packable = false;

    //             resolve(spriteFrame);
    //         }
    //         image.onerror = error => {
    //             console.log("wx load remote image error: ", error);
    //             reject(error);
    //         };
    //     });
    // }


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
                    console.error('加载头像失败', err);
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

    // 此种方式加载头像不需要白名单
    public static loadAvatar2(avatarUrl: string): Promise<SpriteFrame | null> {
        return new Promise((resolve) => {
            // 检查 avatarUrl 是否为空或无效
            if (!avatarUrl || typeof avatarUrl !== 'string' || avatarUrl.trim() === '') {
                console.error('头像地址为空或无效');
                resolve(null);
                return;
            }
            // 创建 Image 对象
            const image = wx.createImage();
            // 监听图片加载完成事件
            image.onload = () => {
                try {
                    // 创建 ImageAsset
                    const imageAsset = new ImageAsset(image);
                    // 创建 Texture2D
                    const texture = new Texture2D();
                    texture.image = imageAsset;
                    // 创建 SpriteFrame
                    const spriteFrame = new SpriteFrame();
                    spriteFrame.texture = texture;
                    // 返回 SpriteFrame
                    resolve(spriteFrame);
                } catch (error) {
                    console.error('创建纹理或精灵帧失败', error);
                    resolve(null);
                }
            };

            // 监听图片加载失败事件
            image.onerror = (err) => {
                console.error('加载头像失败', err);
                resolve(null);
            };

            // 设置图片源（开始加载）
            image.src = avatarUrl;
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
            console.log("pos ", pos.top, pos.left, pos.width, pos.height);
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
                    // backgroundColor: '#ff0000',
                    backgroundColor: '#00000000',
                    color: '#ffffffff',
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
                    console.log("授权失败" + JSON.stringify(res));
                    fail && fail();
                }
            })
        } else {
            console.log("认证过");
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


    public static convertToWxPos(node?: Node): { left: number, top: number, width: number, height: number } {
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

    static imageUrl = null;
    static imageUrlId = null;
    static title = "";
    static query = null;
    public static initShareInfo(title = "", imageUrl = null, imageUrlId: string = null, query = null) {
        console.log("initShareInfo")
        // if (!!!imageUrl) {
        //     imageUrl = canvas.toTempFilePathSync({
        //         destWidth: 500,
        //         destHeight: 400
        //     });
        // }


        window['wx']?.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
        });

        this.title = title;
        this.imageUrl = imageUrl;
        this.imageUrlId = imageUrlId;
        this.query = query;

        //监听右上角的分享好友调用 
        window['wx']?.onShareAppMessage((res: any) => {
            return {
                title: title,
                imageUrl: imageUrl,
                query: query,
                imageUrlId: imageUrlId,
            }
        })

        //监听右上角的分享朋友圈调用 
        window['wx']?.onShareTimeline((res: any) => {
            return {
                title: title,
                imageUrl: imageUrl,
                query: query,
                imageUrlId: imageUrlId,

            }
        })
    }

    public static shareAppMessage(title = "", imageUrl = null, imageUrlId: string = null, query = null) {
        title = title || this.title;
        imageUrl = imageUrl || this.imageUrl;
        imageUrlId = imageUrlId || this.imageUrlId;
        query = query || this.query;

        console.log("title" + title);
        if (window.wx && wx.shareAppMessage) {
            wx.shareAppMessage({
                title: title,
                imageUrl: imageUrl,
                query: query,
                imageUrlId: imageUrlId,
            });
        }
    }

    public static showShareImageMenu() {
        if (window.wx && wx.showShareImageMenu) {
            const tempFilePath = canvas.toTempFilePathSync();
            wx.showShareImageMenu({
                path: tempFilePath,
                style: 'v2',
                needShowEntrance: 'true',
                success: (res) => {
                    console.log('showShareImageMenu success:', res);
                    wx.showToast({
                        title: "处理成功",
                    });
                },
                fail: (res) => {
                    console.log('showShareImageMenu fail:', res);
                    wx.showToast({
                        icon: "error",
                        title: "处理失败",
                    });
                },
            });
        } else {
            wx.showModal({
                title: '提示',
                content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
            })
        }

    }






    public setClipboardData(data) {
        wx.setClipboardData({
            data: data,
            success(res) {
                wx.getClipboardData({
                    success(res) {
                        console.log(res.data) // data
                    }
                })
            }
        })
    }
    public static requirePrivacyAuthorize() {
        wx.requirePrivacyAuthorize({
            success: res => {
                // 进入success回调说明用户已同意隐私政策
                // TODO：非标准API的方式处理用户个人信息
            },
            fail: () => {
                // 进入fail回调说明用户拒绝隐私政策
                // 游戏需要放弃处理用户个人信息，同时不要阻断游戏主流程
            }
        })
    }



}
