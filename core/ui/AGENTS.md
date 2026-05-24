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
- `_Name` 子节点会直接挂到脚本实例上，并绑定 `_onNameTouchStart/Move/End/Cancel`。
- `_image$1` 会设置 `node.$eventName = '_image'`、`node.$ = '1'`，事件名仍按 `_image` 生成。
- 子节点上如果挂了 `Thor`，父级只绑定该 Thor 组件，不继续递归子 Thor 的内部节点。
- `EditBox` 不绑定触摸，避免原生输入异常。
- Button 节点即使没有脚本方法，也会进入触摸绑定，以保留 Cocos Button 事件链。
- 不要在 Thor 子类中重复手动绑定 `_` 开头节点触摸事件，直接实现约定方法。
- 修改 `preventSwallow`、`propagationStopped` 或返回 `false` 语义前，必须在 Cocos 预览中验证点击穿透、Button 点击、拖动和嵌套 Thor。
- `copyBindNodeName` 只用于编辑器类型提示复制，不作为运行时逻辑依赖。

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
- `UIManager.registerUIPrefab(path, bundle?)` 以 prefab 文件名映射 UI 类名，重名 prefab 会报错。
- `showPopup(Class, data, params)` 要求 prefab 根节点挂对应 `UIBase/UIPopup` 脚本。
- `needCache=true` 的 UI 关闭后会从父节点移除并缓存实例；再次打开复用节点。
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
- `MVCompsEdit` 是编辑器辅助组件，不应挂在正式运行时节点上。

## Red Dot

- 红点路径用 `_` 分隔，例如 `EquipmentBtn_WeaponSlot`。
- 父节点 value 由子节点求和，只有叶子节点允许直接改值。
- `RedDotComponent` 用 `UIOpacity` 显示/隐藏，节点必须有该组件。
- 静态入口用 `setStaticPath`，动态列表项用 `setDynamicPath`。
- 动态节点 value 归零时会被自动清理。
- 手动绑定红点监听时，记得在节点销毁或路径失效时解绑。

## 验证建议

- 改 `Thor/UIKiller`：验证 `_` 节点、`$` 节点、Button、EditBox、嵌套 Thor、返回 `false` 的触摸穿透。
- 改 `UIManager/UIPopup`：验证打开、关闭、缓存、销毁、等待队列、挂起恢复、空白关闭和动画。
- 改 MVVM：验证 `VM.add/remove`、路径监听、`VMParent` 的 `*` 替换、Label 模板、controller 写回。
- 改红点：验证静态路径、动态路径、父级求和、动态节点归零清理。
