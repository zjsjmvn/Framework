import { sys } from "cc";
import { native } from "cc";
import { google } from "cc";

// 定义玩家信息接口
interface PlayerInfo {
    playerId: string;
    displayName: string;
}

// 定义登录结果接口
interface LoginResult {
    success: boolean;
    playerInfo?: PlayerInfo;
    error?: string;
}

export default class GooglePlatform {

    public static init() {
        google.play.PlayGamesSdk.initialize();
        native.jsbBridgeWrapper.addNativeEventListener("onGotPlayerId", (result: string) => {
            console.log('>> onGotPlayerId raw result:', result);

            try {
                const data = JSON.parse(result);

                if (data.success) {
                    // 成功获取玩家信息
                    console.log('✅ 获取玩家信息成功:', {
                        playerId: data.playerId,
                        displayName: data.displayName
                    });

                    // 这里可以触发成功回调或更新游戏状态
                    this.onPlayerIdSuccess(data.playerId, data.displayName);

                } else {
                    // 处理失败情况
                    console.error('❌ 获取玩家信息失败:', data.error);

                    // 这里可以触发失败回调或显示错误提示
                    this.onPlayerIdFailed(data.error);
                }

            } catch (e) {
                // 处理 JSON 解析失败的情况
                console.error('❌ 解析结果失败:', result, e);

                // 检查是否是备用格式
                if (result.startsWith('SUCCESS:')) {
                    const playerId = result.replace('SUCCESS:', '');
                    console.log('✅ 获取玩家ID成功 (备用格式):', playerId);
                    this.onPlayerIdSuccess(playerId, '');
                } else if (result.startsWith('ERROR:')) {
                    const error = result.replace('ERROR:', '');
                    console.error('❌ 获取玩家信息失败 (备用格式):', error);
                    this.onPlayerIdFailed(error);
                } else {
                    this.onPlayerIdFailed('未知错误格式');
                }
            }
        });
    }

    /**
         * 异步登录方法
         * @returns Promise<LoginResult> 返回登录结果
         */
    public static async login(): Promise<LoginResult> {
        console.log('🔄 开始获取玩家信息...');

        return new Promise((resolve) => {
            // 临时保存 resolve 函数，等待回调
            this._pendingLoginResolve = resolve;

            // 设置超时处理
            this._loginTimeout = setTimeout(() => {
                if (this._pendingLoginResolve) {
                    this._pendingLoginResolve({
                        success: false,
                        error: '登录超时'
                    });
                    this._pendingLoginResolve = null;
                }
            }, 50000); // 50秒超时

            if (sys.platform == sys.Platform.ANDROID) {
                // 触发原生端获取玩家信息
                native.jsbBridgeWrapper.dispatchEventToNative("fetchCurrentPlayerId", "");
            }
        });
    }

    // 成功回调
    private static onPlayerIdSuccess(playerId: string, displayName: string) {
        console.log('🎉 玩家信息获取完成:', { playerId, displayName });

        // 如果有待处理的登录 Promise，则 resolve
        if (this._pendingLoginResolve) {
            clearTimeout(this._loginTimeout);
            this._pendingLoginResolve({
                success: true,
                playerInfo: { playerId, displayName }
            });
            this._pendingLoginResolve = null;
        }

        // 这里可以添加成功后的逻辑
        // 比如：
        // - 保存玩家信息到本地
        // - 更新UI显示
        // - 触发其他游戏逻辑
        // - 发送事件通知其他系统

        // 示例：触发自定义事件
        // EventManager.instance.fireEvent('PLAYER_ID_READY', { playerId, displayName });
    }

    // 失败回调
    private static onPlayerIdFailed(error: string) {
        console.log('💔 玩家信息获取失败，错误:', error);

        // 如果有待处理的登录 Promise，则 resolve
        if (this._pendingLoginResolve) {
            clearTimeout(this._loginTimeout);
            this._pendingLoginResolve({
                success: false,
                error
            });
            this._pendingLoginResolve = null;
        }

        // 这里可以添加失败后的逻辑
        // 比如：
        // - 显示错误提示
        // - 重试机制
        // - 降级处理

        // 示例：显示错误提示
        // UIManager.instance.showToast('获取玩家信息失败: ' + error);

        // 示例：触发失败事件
        // EventManager.instance.fireEvent('PLAYER_ID_FAILED', { error });
    }

    // 私有属性
    private static _pendingLoginResolve: ((value: LoginResult) => void) | null = null;
    private static _loginTimeout: NodeJS.Timeout | null = null;
}