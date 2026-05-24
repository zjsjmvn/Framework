# core/services/ads 目录开发约定

本目录是广告管理和平台广告 provider 适配层。这里的代码直接接触微信、字节、快应用、原生桥等平台 API，最重要的是保证统一接口、状态清理和失败 fallback。

## 目录职责

- `ads-manager.ts`：广告统一入口，管理 provider、广告位配置、展示顺序、回调消息和基础 banner 样式。
- `providers/iad-provider.ts`：广告 provider 接口契约。
- `providers/*-ads.ts`：各平台 provider 适配。
- `providers/debug-ads/`：调试广告 UI。
- `providers/no-ads.ts`：无广告/测试 provider。
- `providers/nativeads/`：原生广告桥接客户端、proto、listener 和 misc 类型。

## 统一接口

新增或修改 provider 时必须遵守 `IAdProvider`：

- `init(rewardVideosConfigArr, interstitialAdsConfigArr, bannersConfigArr, geZiConfigArr)`
- `showBanner(posName): Promise<boolean>`
- `hideBanner(posName)`
- `hasRewardVideo(posName): boolean`
- `showRewardVideo(posName): Promise<ShowRewardVideoCallBackMsg>`
- `preloadRewardVideo(): Promise<boolean>`
- `hasInterstitial(posName): boolean`
- `showInterstitial(posName): Promise<ShowInterstitialAdCallBackMsg>`
- `preloadInterstitial(posName): Promise<boolean>`

可选：

- `haveCacheVideo(posName): boolean`
- `isShowingRewardVideo`
- `isShowingInterstitial`

## 配置规则

- 业务广告位名使用 `posName`，不要把平台广告 id 写死到业务代码里。
- 平台广告 id 放在 `RewardVideoConfig`、`InterstitialConfig`、`BannerConfig`、`GeZiAdConfig`。
- `AdsManager.init(config)` 当前只初始化一次；测试中如果清 provider，要注意 `initialized` 不会自动重置。
- `AdsManager.showRewardVideo/showInterstitial/showBanner` 会按 provider 顺序尝试，provider 返回成功即停止。

## 状态与回调

- `ShowRewardVideoCallBackMsg.success=true` 才能发奖。
- 用户中途关闭激励视频时应返回 `success=false`，并设置明确 `errMsg`。
- 广告加载失败、展示失败、无广告、平台不支持都要 resolve 失败消息，不要让 Promise 悬空。
- `isShowingRewardVideo`、`isShowingInterstitial` 必须在所有成功、失败、catch、close 回调路径中成对清理。
- 每次注册平台 `onClose/onError/onLoad` 回调时，注意展示结束后 `offClose/offError`，避免重复 resolve。
- 展示失败后如果需要预加载下一条广告，先清旧缓存状态再 preload。

## Banner / Interstitial / Reward

- Banner provider 要维护 `bShow`、`bannerInstance`、`hasBannerInCache/isLoading/pendingShow` 等状态，避免重复创建或重复 destroy。
- `hideBanner` 必须允许无实例、已销毁、未初始化时安全返回。
- 插屏广告要尊重 `AdsManager.interstitialIntervalSeconds`，不要在 provider 内绕过总入口频控。
- 激励视频优先预加载；`hasRewardVideo` 如果总是返回 true，要确保 `showRewardVideo` 内部能处理真实无缓存情况。
- 格子广告目前主要是微信/快应用能力，新增平台前先确认 `GeZiAdConfig` 语义是否适用。

## 平台 API 边界

- 调用 `window.wx/window.tt/window.qg/window.qq` 前必须判断平台对象和具体 API 是否存在。
- 字节、微信、快应用、原生桥 API 的回调结构不同，不要把一个平台的 `errCode/isEnded/style` 语义直接套到另一个平台。
- 平台错误码映射可保留在对应 provider 内，不要散落到 `AdsManager`。
- `DebugAds` 和 `NoAds` 只能用于测试或无广告环境，正式配置中不要误配。
- `nativeads/` 的事件名、payload 结构和 proto 要和原生侧同步修改。

## 修改与验证

- 改 provider 初始化：验证空配置、缺广告位、重复 init、多个 posName。
- 改激励视频：验证预加载成功、预加载失败、展示成功、用户关闭、展示失败、重复点击。
- 改插屏：验证频控、加载失败、展示失败、关闭回调、重复展示。
- 改 Banner：验证 show、hide、重复 show、重复 hide、屏幕尺寸/刘海/横竖屏样式。
- 改原生桥：同步验证原生事件 payload、listener 清理和错误回调。
