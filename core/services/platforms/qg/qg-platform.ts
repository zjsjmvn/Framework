export default class QGPlatform {


    public static login(): Promise<{ openId: string, authCode: string, nickname: string, avatarUrl: string }> {
        return new Promise((resolve, reject) => {
            qg.login({
                needAuthCode: false,
                success: res => {
                    const { authCode, openId, nickname, avatarUrl } = res

                    console.log(`authCode:${authCode},openId:${openId},nickname:${nickname},avatarUrl:${avatarUrl}`);
                    resolve(res);
                },
                fail: res => {
                    // errCode、errMsg
                    const { errCode, errMsg } = res
                    qg.showToast({
                        title: `登录失败: ${errCode} - ${errMsg}`,
                        icon: 'error'
                    })
                    resolve(null);
                },
                complete: () => {
                    console.log('login接口 compelete')
                }
            })
        })
    }




}