# framework 目录开发约定

本文件只约束 `assets/game/scripts/framework/` 目录。这里是主项目共享框架层，不是具体玩法层。修改这里的代码前，先确认影响范围；任何框架 API、节点绑定规则、UI 生命周期、资源加载、广告平台适配或 ECS 行为的变化，都可能影响多个业务模块、编辑器视图、弹窗和运行时 UI。

## 目录定位

- `core/`：项目自有框架代码，包括服务、UI、MVVM、引导、工具、技能抽象等。
- `libs/`：底层库和第三方依赖封装，包括 ECS、http、encrypt、reflect、async；涉及 `libs/ecs/` 时继续阅读 `libs/ecs/AGENTS.md`。
- `core/game-context.ts`：服务注册和获取入口。
- `core/services/`：事件、本地存储、音频、广告、分享、录屏、平台适配；涉及 `core/services/ads/` 时继续阅读 `core/services/ads/AGENTS.md`。
- `core/ui/`：UI 自动绑定、弹窗管理、MVVM、红点系统和基础 UI 组件；涉及该目录时继续阅读 `core/ui/AGENTS.md`。
- `core/guide/`：旧引导系统，仍保留兼容。
- `core/guide-next/`：新引导系统，已有独立 `AGENTS.md`，维护时同时遵守子目录说明。
- `core/utils/`：通用工具、随机数、资源加载、Canvas 适配、Bezier/曲线、节点扩展等。
- `core/skills/`：技能、Buff、被动条件的轻量抽象。
- `core/extensions/`：全局原型扩展，例如 `String.prototype.format`、`Date.prototype.format`。

## 总原则

- framework 层不要依赖 `assets/game/scripts/game/` 下的具体业务、具体关卡、具体场景节点或具体 prefab 名。
- 保持 API 向后兼容。确实要改公开行为时，同步更新调用方、根目录 `AGENTS.md`、本文件和相关测试。
- 不要为了单个玩法问题在 framework 层加入只服务局部业务的特殊判断。
- 不要随意移动 Cocos 资源文件；新增、移动或删除资源时必须保留并同步对应 `.meta`。
- 不要修改 `library/`、`temp/`、`build/` 等 Cocos 缓存/输出目录。
- 不要把一次性调试代码、测试按钮、测试日志长期留在框架基础设施里。
- 修改底层工具、原型扩展、UI 绑定、ECS、事件总线、资源释放、广告平台适配时，要优先评估全项目调用面。

## 第三方与 vendored 文件

- `libs/http/axios.js`、`libs/http/axios.d.ts` 是 Axios 相关第三方代码。
- `libs/encrypt/crypto-js.js`、`libs/encrypt/crypto-js.d.ts` 是 CryptoJS 相关第三方代码。
- `libs/reflect/Reflect.js`、`libs/reflect/Reflect.d.ts` 是 Reflect metadata 相关第三方代码。
- `libs/async.js` 是旧引导使用的 async 流程库。
- 除非是在升级第三方库或修复明确的适配问题，否则不要手改这些 vendored 文件。
- 业务封装优先放在 `encrypt-util.ts`、`http-status-code-enum.ts` 或项目自有适配层里。

## GameContext / Service

- 服务类通过 `InjectService(serviceName, CCComponent?)` 注册。`serviceName` 必须稳定，不要依赖压缩后的类名。
- `CCComponent=true` 的服务会从当前场景 `Canvas` 及其子节点查找，同名服务必须唯一。
- 非 Cocos 组件服务会由 `GameContext.registerServices()` 直接 `new` 出实例并放入字典。
- 获取服务统一使用 `GameContext.getService(ServiceClass)`；测试或特殊场景可用 `manualRegisterService` 注入替身。
- 不要在服务构造或注册时访问具体业务节点，场景节点依赖应放在组件生命周期或业务初始化里。

## EventManager

- `EventManager` 是 `@singleton` 单例，提供 `on/off/emit` 与 `addEventListener/removeEventListener`。
- 同一 `eventName + callback + target` 不会重复添加。
- `EventListener.bindToDestroyableTarget(nodeOrComponent)` 会在节点销毁时自动移除监听，组件生命周期内的监听优先使用该机制或在 `onDisable/onDestroy` 中成对解绑。
- `fireEvent/emit` 会复制监听器数组后派发，允许回调中增删监听。
- 当前对无监听事件会打印 error；新增事件时注意避免高频无监听 emit 污染日志。
- 带 `tag` 的监听可通过 `removeEventListenerByTag` 移除，但同事件同 tag 只会移除第一个匹配项。

## Storage / Encrypt

- `LocalDataProvider` 默认不加密；启用加密时必须传入 AES `key` 和 `iv`。
- 加密模式下存储 key 会先 `md5`，value 会用 AES-CBC + Pkcs7 后写入 `sys.localStorage`。
- `write(key, null)` 会移除存储；不要把函数作为存储值。
- `read(key, defaultValue)` 会根据默认值类型做 number/boolean/string 转换。
- `readObj<T>` 只适合读取 JSON 对象，解析失败会返回默认值。
- 注意 `remove(key)` 当前始终对 key 做 `md5`，修改前要兼容已有存档。

## UIKiller / Thor 自动绑定

继承于 `Thor` 的组件会在 `__preload` 中自动调用 `bind()`，由 `UIKiller.bind` 递归绑定节点和触摸事件。

- 组件自身会绑定触摸事件，回调名为 `_onTouchStart`、`_onTouchMove`、`_onTouchEnd`、`_onTouchCancel`。
- 所有子节点会绑定到父节点对象上，可通过 `nodeA.nodeB.nodeC` 链式访问。
- 子节点以下划线 `_` 开头时，会直接绑定到脚本实例上，并监听触摸事件。
- `_ABC` 对应 `_onABCTouchStart`、`_onABCTouchMove`、`_onABCTouchEnd`、`_onABCTouchCancel`。
- `_image$1` 会记录 `node.$eventName = '_image'` 和 `node.$ = '1'`，运行时节点名会变成 `_image1`，事件方法仍按 `_image` 生成。
- `$` 后缀节点可以通过 `event.currentTarget.$` 或 `node.$` 读取编号。
- 子节点上如果挂有 `Thor`，父级绑定只记录该 Thor 组件，不继续递归它的内部节点；内部由子 Thor 自己绑定。
- `EditBox` 节点不会绑定触摸事件，避免原生输入异常。
- Button 节点即使没有脚本回调，也会参与触摸绑定，保持按钮事件链。
- 触摸回调返回 `false` 时表示当前框架逻辑希望该触摸穿透/放行；修改 `preventSwallow`、`propagationStopped` 语义前必须实机验证。
- 不要在继承 `Thor` 的组件里再为 `_` 开头节点重复手动绑定触摸事件，直接实现约定回调方法。
- `copyBindNodeName` 只用于编辑器复制类型提示信息，不要依赖它作为运行时逻辑。

## ExtendCCComponent 调度

- `ExtendCCComponent` 提供 `startScheduler/stopScheduler/hasScheduler`，并在 `onDestroy` 自动停止所有已注册调度。
- 同一个 key 不应重复注册；重复会打印错误。
- 子类重写 `onDestroy` 时必须调用 `super.onDestroy()`，否则调度不会自动清理。
- 只有需要按 key 管理生命周期的 schedule 才使用该封装；简单生命周期调度可直接用 Cocos API。

## UI Framework

- `UIBase` 是所有框架 UI 的基类，继承 `Thor`，提供 `init/show/hide/close` 和 `before/on/after` 生命周期钩子。
- `UIPopup<T>` 用于弹窗，支持空白关闭、任意处关闭、`PopupAction` 打开/关闭动画。
- 开启 `touchBlankPlaceToClose` 的弹窗必须有 `Container` 节点，用于计算非空白区域。
- `PopupAction` 默认依赖 `Bg` 和 `Container` 节点，并要求对应节点上有 `UIOpacity`。
- `UIManager` 是单例，负责 prefab 扫描、弹窗队列、挂起/恢复、缓存、tips。
- UI prefab 注册通过 `UIManager.registerUIPrefab(path, bundle?)`，以 prefab 文件名映射脚本类名；重名 prefab 会报错。
- `UIManager.showPopup(Class, data, params)` 会按类名查找 prefab；prefab 根节点必须挂对应 `UIBase/UIPopup` 脚本。
- `needCache=true` 的 UI 关闭后会从父节点移除并缓存实例；再次打开复用同一节点。
- `PopupParams.immediately=false` 会进入等待队列；`suspendCurrent=true` 会挂起当前弹窗。
- 不要在业务中直接操作 `UIManager` 的内部队列、`_currentShowingPopup` 或缓存 Map。

## MVVM

- `VM.add(data, tag)` 注册数据模型，`tag` 不允许包含 `.`，同名 tag 不允许重复。
- 全局路径格式为 `tag.path.to.value`，通过 `VM.getValue/setValue/addValue/bindPath/unbindPath` 访问。
- `ViewModel` 基于 `Observer` 用 `Object.defineProperty` 监听对象字段变化，并通过 `director.emit('VC:' + path)` 派发。
- `Observer` 不监听 `Node`、`ECS.Entity` 本体和数组内部变化；修改数组监听能力前要谨慎评估性能。
- `VMBase.watchPathArr` 支持 `*`，会按父节点子节点索引替换；路径为空或 `*` 未被 `VMParent` 替换会报错。
- 继承 `VMBase` 的组件重写 `onLoad/onEnable/onDisable` 时必须调用 `super`，否则路径解析和绑定不会生效。
- `VMParent` 和 `VMParentExtendThor` 会为 prefab 局部数据创建临时 tag，并把子 VM 的 `*` 替换为该 tag；重写 `onLoad/onDestroy` 必须调用 `super`。
- `VMLabel` 使用文本模板 `{{0}}`、`{{0:int}}`、`{{1:fix2}}` 等格式，`watchPathArr` 顺序决定模板值。
- `VMCustom` 可把任意组件属性双向绑定；开启 `controller` 后靠脏检查把组件值写回 VM。
- `VMProgress` 默认需要两个路径：当前值和最大值。
- `VMEvent` 用于值变化时触发 Cocos `EventHandler`，可配置比较过滤。
- `VMState` 是旧状态控制，`VMStateNew` 支持源路径、目标路径/数字、range 和动态配置；新增功能优先放在 `VMStateNew`。
- `MVCompsEdit` 是编辑器辅助脚本，不应留在运行时正式节点上。

## Red Dot

- 红点路径用 `_` 分隔，例如 `EquipmentBtn_WeaponSlot`。
- `RedDotManager` 使用树形结构统计 value；父节点 value 等于子节点 value 之和。
- 只有叶子节点允许直接 `changeValue`，不要直接改非叶节点值。
- `RedDotComponent` 通过 `UIOpacity` 控制显示，节点必须有 `UIOpacity`。
- 静态节点用 `setStaticPath`，动态列表/背包物品等用 `setDynamicPath`。
- 动态节点 value 归零时会被 `RedDotManager.clean` 删除以节约内存。
- `RedDotComponent.onDestroy` 会移除监听；手动绑定监听时也要考虑解绑。

## Guide / Guide Next

- `core/guide` 是旧引导：依赖 `GuideHelper.Locator` 根据节点名/链式路径定位，依赖 `GuideController`、`GuideView`、`GuideStep` 和 `async.eachSeries` 顺序执行。
- 旧引导仍可维护兼容问题，但不要为了新业务扩展旧架构。
- 新引导统一使用 `core/guide-next`，并遵守 `core/guide-next/AGENTS.md`。
- 新引导目标必须通过 `GuideAnchor.guideId` 注册稳定业务 id，不要使用场景层级路径。
- 业务接入优先从 `core/guide-next/index.ts` 导入类型和服务。
- `GuideService` 保证同一时间只有一个 runner；不要绕过它直接制造多个遮罩抢输入。
- 修改步骤数量、顺序或含义后要提升 `GuideFlowConfig.version`，避免旧进度错位。
- `GuideAnchor.passThrough = true` 表示命中目标区域时真实 UI 也能响应；不要改反 Cocos `preventSwallow` 语义。

## ECS

- ECS 位于 `libs/ecs/ecs.ts`，导出模块名为 `ECS`。
- 自定义组件必须继承 `ECS.Component`，并用 `@ECS.register('Name')` 注册稳定组件名。
- Cocos Component 类型不能由 ECS new 出来时，使用 `@ECS.register('Name', false)`，并由外部创建后加入实体。
- 组件的 `init()` 在组件回收前调用，用于重置数据和解除引用；不要留空除非能保证复用前完全覆盖所有字段。
- 实体通过 `ECS.createEntity`、`createEntityWithComp`、`createEntityWithComps` 创建，销毁用 `entity.destroy()`。
- 不要直接 `new` 普通 ECS 组件再期望 ECS 自动回收；外部创建的组件会 `canRecycle=false`。
- `entity.remove(Component, false)` 会把组件对象留在实体缓存中，下次重新添加复用原对象。
- `allOf/anyOf/excludeOf` 可组合查询；`onlyOf` 会监听大量组件增删，非必要不要使用。
- `ComblockSystem` 的 `update` 参数是实体数组，不是单个实体；实现 `entityEnter/entityRemove/firstUpdate` 时保持数组语义。
- `RootSystem.clear()` 只调用系统 `onDestroy`，实体清理另用 `ECS.clear()`。
- `EntityLink` 通过 `eid` 把 Cocos 节点和 ECS 实体关联，实体销毁后要处理空返回。
- `NumericComponent` 的 `Base` 和 `Final` 不允许直接累加；用 `setByKey` 修改 Base/加值/百分比并让 `update()` 计算 Final。

## Resource / Asset

- `resLoader` 封装 `resources` 和 bundle 加载，支持 remote、bundle、单资源、目录、释放和缓存读取。
- 默认 bundle 名是 `resources`；加载其他 bundle 时显式传 bundleName。
- `release` 和 `releaseDir` 会释放 prefab 依赖，使用前确认资源确实不再被节点或缓存 UI 引用。
- `ImageUtil` 会手动向 `assetManager.assets` 和 `dependUtil` 注册运行时图片资源；改动前要验证资源释放与重复 uuid 问题。
- `EditorTool.load` 只在 `EDITOR` 环境通过 `Editor.Message.request('asset-db', 'query-uuid', ...)` 加载资源，运行时返回 `null`。
- 新增运行时资源加载路径时，不要硬编码具体业务 bundle，除非调用方显式传入。

## Utils / Extensions

- `NodeUtil` 扩展了 `cc.Node` 原型属性：`x/y/z`、`scaleX/Y/Z`、`angleX/Y/Z`、`zIndex`。修改这些 getter/setter 会影响全项目节点访问习惯。
- `zIndex` 通过 siblingIndex 模拟层级排序，不等同于引擎原生渲染层。
- `CanvasAdapter` 根据 `ResolutionType` 设置设计分辨率，`CUSTOM` 会按可见比例在 `FIXED_WIDTH/FIXED_HEIGHT` 间切换。
- 随机工具有多个版本：`lcg-random.ts`、`lcg-random-bigger.ts`、`mcg-random.ts`。需要可复现大 seed 时优先使用 `lcg-random-bigger.ts`。
- `MathUtil.random*`、`ArrayUtil` 的随机方法使用 `Math.random()`，不适合需要 seed 复现的逻辑。
- `PromiseUtil.delay` 基于 Cocos tween，不是原生 `setTimeout`；时间单位是毫秒。
- `BlockUtil.block/httpBlock` 是方法装饰器级防抖，`httpBlock` 返回 `Promise.resolve(["请求太快", null])`。
- `core/extensions/string/format.ts` 会扩展 `String.prototype.format` 和 `Date.prototype.format`；修改正则或格式语义会影响全局。
- `versionCompare(curV, reqV, withEqual)` 只支持点分数字版本。

## Audio

- `AudioManager.instance` 会创建持久节点 `AudioManager`，子节点 `AudioMusic` 和 `AudioEffect`。
- 调用 `init/registerMusicAndEffect(path, bundle)` 后，会扫描指定目录下 `AudioClip`，按文件名映射路径。
- `playMusic/playEffect` 的参数是扫描得到的音频文件名，不是完整路径。
- 音乐使用 `AudioMusic`，音效使用 `AudioEffect.playOneShot`；音效播放期间无法精确即时关闭。
- 修改音频缓存和释放逻辑时，确认 `musics/effects` Map 与 bundle 资源生命周期一致。

## Ads / Platform / Share / Record

- 广告统一接口是 `IAdProvider`；新增平台广告必须实现 init、banner、interstitial、reward、preload、has 系列方法。
- `AdsManager.init(config)` 只初始化一次；测试重置时可用 `removeAllAdvertiser()` 清 provider，但要注意 `initialized` 状态。
- 广告位使用 `posName` 作为业务名，具体 id 放在 `RewardVideoConfig/InterstitialConfig/BannerConfig/GeZiAdConfig`。
- `ShowRewardVideoCallBackMsg.success` 表示是否发奖，`errMsg` 表示失败原因，`skip` 表示跳过语义。
- 各平台 provider 会直接访问 `window.tt/window.wx/window.qg/window.qq` 等宿主 API；调用前必须确认当前平台存在对应能力。
- provider 内部的 `isShowingRewardVideo/isShowingInterstitial` 要成对设置和清理，避免广告失败后锁死。
- Banner show/hide 必须维护 `bShow`、实例对象和缓存状态，避免重复创建或 destroy 空对象。
- `NoAds` 和 `DebugAds` 用于无广告/调试环境，不要上线误配到正式广告策略。
- `nativeads/` 是原生广告桥接客户端和 proto，修改事件名、payload 解析或 listener 接口时要同步原生侧。
- `RecordVideoManager` 面向 `tt/swan` 录屏 API；它会监听前后台事件，改动时检查 pause/resume 是否成对。
- `ShareManager` 是 provider 桥接；具体平台分享能力放 provider 中，不要让业务直接散落平台 API。
- 平台工具如 `WXPlatform`、`TTPlatform`、`WebPlatform`、`GooglePlatform` 提供平台登录、头像、分享、订阅、侧边栏、原生桥等能力；新增能力优先封装在平台类或 service 内。

## Skills

- `BaseSkill` 只定义 `onAdd/onRemove/applyNewLevel` 基础生命周期。
- `BuffSkill` 是抽象 Buff，约定 `meetRemoveCondition()`；持续时间、次数、tick 类型分别在子类中实现。
- `PassiveSkill` 持有 `PassiveCondition` 列表，但当前 `meet()` 仍是空实现；扩展前先明确条件组合语义。
- 当前技能系统是轻量基础骨架，不要在这里直接写具体怪物、关卡或道具业务。

## 修改建议与验证

- 改 `ui-killer`、`Thor`、`ExtendCCComponent`：优先运行编辑器/弹窗/Thor 自动绑定相关轻量测试，并在 Cocos 预览中点按 `_` 节点、Button、EditBox 和嵌套 Thor 节点。
- 改 `UIManager/UIPopup`：验证 prefab 扫描、打开、关闭、缓存、挂起恢复、空白关闭和动画。
- 改 `MVVM`：验证 `VM.add/remove`、路径监听、`VMParent` 的 `*` 替换、Label 模板和 controller 双向写回。
- 改 `ECS`：验证组件注册、添加/删除/回收、group 查询、entityEnter/entityRemove、RootSystem 执行顺序。
- 改 `resLoader/ImageUtil`：验证 bundle 资源加载、目录加载、释放、重复加载和运行时图片显示。
- 改 `EventManager`：验证重复监听、解绑、tag 解绑、节点销毁自动解绑和回调中移除监听。
- 改 `guide-next`：同时遵守 `core/guide-next/AGENTS.md` 的验证清单。
- 改广告/平台：至少在对应平台 mock 或真机环境验证广告加载、展示、关闭、失败、重复调用和 fallback。
- 根项目全量 TypeScript 检查可能受 Cocos/扩展声明影响，不一定干净；框架纯逻辑改动应尽量补充或运行轻量脚本测试。

## 不要做的事

- 不要在 framework 层写具体游戏关卡、猪、箭头盒、颜色配置等业务规则。
- 不要为修单个界面临时改变 `Thor`/`UIKiller` 的全局绑定规则。
- 不要改 vendored 第三方库来绕过上层封装问题。
- 不要新增全局原型扩展，除非确实是全项目约定，并同步说明和验证。
- 不要在没有平台能力判断的情况下直接调用 `window.tt/window.wx/window.qg` 等宿主 API。
- 不要把编辑器辅助组件长期挂在正式运行时节点上。
- 不要忽略 `.meta` 文件变更。
