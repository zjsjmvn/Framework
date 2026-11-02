# core/ui 目录开发约定

本目录负责 UI 自动绑定、弹窗管理、MVVM、红点和基础 UI 组件。这里的改动影响面很大：一个绑定规则或生命周期变化，可能让所有界面、编辑器视图和弹窗同时受影响。

## 目录职责

- `ui-killer/`：`Thor` 和 `UIKiller` 自动节点绑定、触摸事件绑定。
- `ui-framework/`：`UIBase`、`UIPopup`、`UIManager`、tips 和弹窗动画。
- `mvvm/`：`VM`、`ViewModel`、`Observer` 和各类 VM 组件。
- `red-dot/`：树形红点系统。
- `components/`：UI 基础组件扩展，例如 `ExtendCCComponent`。

## 总原则

- 不要在 UI 框架层引用具体游戏业务目录、具体场景节点或具体关卡数据。
- 不要为单个界面临时改变全局绑定、弹窗、MVVM 或红点规则。
- 改公开行为时同步更新 `framework/AGENTS.md` 和相关调用方。
- 新增 Inspector 字段时写清楚 `displayName` 和 `tooltip`，已有中文 Inspector 风格要保持一致。
- 修改基础生命周期时，先确认子类是否依赖 `super.onLoad/onEnable/onDisable/onDestroy`。

## Thor / UIKiller

继承 `Thor` 的组件会在 `__preload` 中自动绑定节点和触摸事件。

- 组件自身绑定 `_onTouchStart`、`_onTouchMove`、`_onTouchEnd`、`_onTouchCancel`。
- 子节点会挂到父节点对象上，可通过 `nodeA.nodeB.nodeC` 链式访问。
- 递归访问到的节点会挂载自身组件快捷字段，例如 `node.Panel.$Sprite`、`node.Panel.Title.$Label`、`this._MsgText.$RichText`。
- Cocos 3.8 的 Camera 组件运行时名可能是 `Camera<CameraComponent>`；UIKiller 会归一为 `$Camera`，以保持运行时字段与 Thor 绑定导出一致。
- `_Name` 子节点会直接挂到脚本实例上，并绑定 `_onNameTouchStart/Move/End/Cancel`。
- `_image$1` 会设置 `node.$eventName = '_image'`、`node.$ = '1'`，事件名仍按 `_image` 生成。
- 子节点上如果挂了 `Thor`，父级只绑定该 Thor 组件，不继续递归子 Thor 的内部节点。
- `EditBox` 不绑定触摸，避免原生输入异常。
- Button 节点即使没有脚本方法，也会进入触摸绑定，以保留 Cocos Button 事件链。
- 不要在 Thor 子类中重复手动绑定 `_` 开头节点触摸事件，直接实现约定方法。
- 修改 `preventSwallow`、`propagationStopped` 或返回 `false` 语义前，必须在 Cocos 预览中验证点击穿透、Button 点击、拖动和嵌套 Thor。
- `copyBindNodeName` 是编辑器类型提示复制入口；需要脚本主动获取绑定类型文本时调用 `Thor.exportBindNodeName()`，它只返回 `//#region uikiller` 文本并会先触发 `bind()`。
- 命令行可用 `npm run export:thor-bind -- --asset <scene-or-prefab> --node <NodeName> --component <ThorClass>` 从磁盘上的 `.scene/.prefab` 离线导出同类绑定文本；加 `--script <ts-file> --write` 时只替换目标脚本中已有的 `//#region uikiller` 块。

## ExtendCCComponent

- `startScheduler(key, func, interval, repeat, delay)` 会按 key 管理 schedule。
- `stopScheduler(key)` 只停止对应 key 的函数。
- `onDestroy` 会停止所有已注册调度；子类重写时必须调用 `super.onDestroy()`。
- 同 key 重复注册会报错，新增定时逻辑时要使用稳定 key。

## UI Framework

- `UIBase` 是基础类，继承 `Thor`，提供 `init/show/hide/close` 与 `before/on/after` 钩子。
- `UIPopup` 用于弹窗，支持空白关闭、任意处关闭和 `PopupAction` 动画。
- 开启 `touchBlankPlaceToClose` 的 popup 必须有 `Container` 节点。
- `PopupAction` 默认依赖 `Bg`、`Container` 和 `UIOpacity`。
- `UIManager.registerUIPrefab(path, bundle?)` 只枚举 Prefab 元数据，以文件名映射 UI 类名；相同包/路径重复注册幂等，同名不同来源报错并保留原映射。
- 弹窗继承 `UIPopup<T>`，Prefab 根节点序列化对应子类。`showPopup(Class, data, params): Promise<Popup>` 复用框架的加载、队列与缓存流程，在节点挂载、`init(data)` 和 `show()` 完成后返回实例。子类的 `init` 调用 `super.init(data)` 保存本次数据；业务绑定在已有根节点上执行。
- `preloadPopup(Class): Promise<Prefab>` 真实加载并反序列化指定弹窗，和 `showPopup` 共用一份在途请求及缓存引用；失败后可重试。只枚举元数据或下载资源不算准备完成。
- `isPopupReady(Class)` 查询同一管理器缓存；会话释放后即为假，即使引擎 Bundle 仍因其他引用保有有效 Prefab，也要重新进入管理器准备流程。
- `CacheMode.Once` 关闭后销毁节点并释放 Prefab；`Normal` 销毁节点、保留 Prefab；`Frequent` 停用并移出节点后缓存实例，下一次复用并重新 `init`。显式 `params.mode` 优先；未指定时，Prefab 的 `needCache=true` 选择 `Frequent`。
- `params.parent` 指定挂载父节点，默认当前场景 Canvas；`params.isValid()` 校验业务打开意图。`immediately=false` 等当前弹窗结束后按优先级展示；`suspendCurrent=true` 挂起当前弹窗并在后继关闭后恢复。业务数据与资源加载均不能越过已失效的父节点或打开意图。
- 关闭入口使用 `closePopup(instance)` 或 `closePopupByClass(Class)`；后者同时取消该类正在加载、等待和挂起的请求。未展示完成的 `showPopup` Promise 以 `PopupCancelledError` 拒绝，迟到加载不得再次 `init/show`。关闭钩子与动画完成后由管理器按缓存模式回收节点。
- `releasePopup(Class)` 取消该类全部请求、关闭实例并退休其 Prefab 缓存；迟到预加载以 `PopupCancelledError` 拒绝。Prefab 的 `decRef` 等待最后实例的 `NODE_DESTROYED`，不能在 `destroy()` 调用后就释放依赖。重新打开形成的新缓存不受旧实例销毁回调影响。
- 普通节点模板由业务模块通过 `resLoader` 加载、持有引用并实例化；弹窗资源及实例只由以上 popup API 管理。
- 不要从业务直接改 `UIManager` 的内部队列、`_currentShowingPopup`、`cachedUI` 或 prefab 映射 Map。
- 改 `showPopup/closePopup/showNextPopup/suspendCurrentPopup` 时，验证等待队列、挂起队列、缓存 UI 和销毁 UI 四种路径。

## MVVM

- `VM.add(data, tag)` 注册模型，tag 不能包含 `.`，也不能重复。
- 全局路径格式为 `tag.path.to.value`。
- `ViewModel` 通过 `Observer` 监听对象属性，变化后用 `director.emit('VC:' + path)` 派发。
- `Observer` 不监听 `Node`、`ECS.Entity` 本体和数组内部变化；不要轻易打开深层数组监听。
- `VMBase.watchPathArr` 支持 `*`，由 `VMParent` 替换为 prefab 局部 tag。
- 继承 `VMBase` 的组件重写 `onLoad/onEnable/onDisable` 时必须调用 `super`。
- `VMParent` 和 `VMParentExtendThor` 重写 `onLoad/onDestroy` 时必须调用 `super`，否则临时 VM 不会注册或释放。
- `VMLabel` 文本模板使用 `{{0}}`、`{{0:int}}`、`{{1:fix2}}`，路径顺序决定模板值。
- `VMCustom.controller=true` 会用脏检查把组件属性写回 VM，谨慎用于高频节点。
- `VMProgress` 默认监听两个路径：当前值和最大值。
- `VMState` 是旧状态组件；新增条件控制优先扩展 `VMStateNew`。
- 不想修改 scene/prefab 或不适合在编辑器挂 VM 组件时，优先使用 `code-vm-binding-scope.ts` 做代码声明式绑定；调用方显式传入 `VM`、在生命周期结束时调用 `clear()`，不要运行时给静态节点补挂 `VMLabel/VMProgress` 来绕过编辑器配置。
- `MVCompsEdit` 是编辑器辅助组件，不应挂在正式运行时节点上。

## Red Dot

- 红点路径用 `_` 分隔，例如 `EquipmentBtn_WeaponSlot`。
- 父节点 value 由子节点求和，只有叶子节点允许直接改值。
- `RedDotComponent` 用 `UIOpacity` 显示/隐藏，节点必须有该组件。
- 静态入口用 `setStaticPath`，动态列表项用 `setDynamicPath`。
- 动态节点 value 归零时会被自动清理。
- 手动绑定红点监听时，记得在节点销毁或路径失效时解绑。

## 验证建议

- 改 `Thor/UIKiller`：验证 `_` 节点、`$` 节点、Button、EditBox、嵌套 Thor、返回 `false` 的触摸穿透；改绑定导出时同时运行 `test/thor-bind-exporter.test.ts` 和 `test/thor-direct-bound-fields-static.test.ts`。
- 改 `UIManager/UIPopup`：运行根仓库 `tests/render/ui-manager-prefabs.test.js`，覆盖真实 `showPopup/preloadPopup`、三种缓存模式、加载失败重试、挂起/等待期间取消及延迟销毁引用；Cocos 预览补充空白关闭和动画。
- 改 MVVM：验证 `VM.add/remove`、路径监听、`VMParent` 的 `*` 替换、Label 模板、controller 写回。
- 改红点：验证静态路径、动态路径、父级求和、动态节点归零清理。
