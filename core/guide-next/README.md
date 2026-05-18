# Guide Next

`guide-next` 是新的完整新手引导框架，和旧的 `framework/core/guide` 并行存在，不依赖旧实现。

## 设计目标

旧引导通常容易把“流程配置”和“场景层级路径”绑在一起：按钮改名、节点换父节点、界面拆 prefab 后，引导就跟着失效。`guide-next` 的核心思路是把目标节点抽象成稳定的业务锚点：

- 场景节点只负责声明“我是谁”：通过 `GuideAnchor.guideId` 暴露业务语义。
- 引导流程只负责声明“要做什么”：通过 `GuideFlowConfig.steps` 引用 `guideId`。
- 运行器只负责声明“怎么推进”：等待目标、显示遮罩、判断输入、保存进度。

这样 UI 可以重排，流程配置不用跟着改路径；动态节点也可以在创建后注册成同一个 `guideId`。

## 核心设计

- `GuideAnchor` 挂在需要引导的节点上，只声明稳定的 `guideId` 和点击区域。
- `GuideFlowConfig` 集中描述整条引导流程，步骤只引用 `guideId`，不写场景层级路径。
- `GuideRunner` 统一处理步骤生命周期、目标等待、输入判断、进度存档和失败。
- `GuideDefaultOverlay` 默认自动创建遮罩、洞、高亮、文字和手指动画。
- `GuideFlowComponent` 可挂在节点上，让步骤能在 Cocos Inspector 中配置。

## 运行原理

一次引导从 `GuideService.start(flow)` 开始：

1. `GuideService` 停掉当前正在跑的引导，创建默认遮罩层或使用传入的自定义遮罩。
2. `GuideRunner` 读取 `guideId + version` 对应的进度，决定从第几个步骤继续。
3. 每个步骤开始前，`GuideRunner` 从 `GuideAnchorRegistry` 查询目标 `guideId`。
4. 如果目标还没出现，且步骤配置了 `targetMissPolicy: Wait`，运行器会等待锚点注册，直到 `waitTargetTimeout`。
5. 找到目标后，`GuideAnchor.getSnapshot()` 会把目标的世界坐标矩形转换到遮罩层坐标系。
6. `GuideDefaultOverlay` 根据这些快照绘制遮罩、镂空区域、高亮、文字和手指动画。
7. `GuideRunner` 按步骤类型绑定触摸、事件、计时器或自定义异步逻辑。
8. 步骤完成后运行 `verify/onComplete`，保存进度，清理本步骤的触摸监听和遮罩状态。
9. 所有步骤完成后保存完成状态，销毁遮罩，并触发 `onComplete`。

步骤失败会停止当前流程并抛出错误；`GuideService.start()` 会把错误传给 `options.onError` 并打印日志。

## 锚点原理

`GuideAnchor` 是目标节点和引导系统之间的唯一绑定点。组件启用时注册到 `GuideAnchorRegistry`，禁用或销毁时注销。运行器不查场景路径，只通过 `guideId` 找当前可用的锚点。

一个 `guideId` 最好只有一个可用节点。如果重复注册，注册表会警告，并使用第一个可用锚点。动态列表、复用节点、对象池节点要特别注意在节点复用时重新设置正确的 `guideId`。

`GuideAnchor.getSnapshot()` 不是缓存节点引用就结束，而是在步骤开始时拍一份快照：

- `worldRect`：目标节点当前世界坐标矩形。
- `rectInOverlay`：同一个矩形转换到遮罩层本地坐标后的位置。
- `padding`：锚点默认 padding 或步骤上的 `maskPadding`。
- `passThrough`：目标区域默认是否把触摸透传给真实节点。

遮罩绘制和输入判断都使用快照。这样每个步骤开始时都会拿到目标的最新布局，适配界面重新排版、分辨率变化和动态节点生成。

## 遮罩和输入原理

默认遮罩不是 Cocos 的 Mask 组件，而是用 `Graphics` 在遮罩层上画出目标区域之外的矩形块。它会把屏幕边界和所有镂空区域的边界切成网格，只填充不在镂空内的小矩形。这样可以同时支持多个矩形洞，也不依赖 shader。

触摸处理分两层：

- `GuideDefaultOverlay` 只负责接收触摸事件，并把事件交给当前步骤绑定的 `touchHandler`。
- `GuideRunner` 根据步骤类型判断点击、长按、拖拽、滑动是否完成，并返回这次触摸是否应该被遮罩吞掉。

`passThrough` 的含义是“命中目标区域时，真实业务节点是否也能收到触摸”。常用配置：

- `passThrough: true`：玩家点到目标时，引导步骤完成，底下真实按钮也能响应。
- `passThrough: false`：玩家点到目标时，只完成引导，不触发底下业务逻辑。
- `blockOthers: true`：无论点哪里都由引导层拦住，适合强制流程。

目标区域之外默认会被遮罩拦截，避免玩家在引导中误触其它 UI。注意步骤级 `passThrough: true` 会让当前步骤的目标内外触摸都透传；如果只希望目标区域透传，优先配置 `GuideAnchor.passThrough = true`，并让步骤不写 `passThrough`。

## 进度原理

默认存档使用 `GuideLocalStorage`，key 由 `guideId + version` 组成。完成一个步骤后保存 `completedStepIndex`，整条流程完成后保存 `completed: true`。

修改流程时要提升 `version`。例如新增步骤、删除步骤、调整顺序后，如果不升版本，老玩家可能从旧的步骤下标继续，导致流程错位。升版本后会使用新的存档 key，不会被旧进度污染。

常用控制：

- `autoSaveProgress: false`：不自动保存步骤进度，适合测试或一次性流程。
- `restartFromBeginning: true`：忽略已有进度，从第一步重新开始。
- `GuideLocalStorage.clearProgress(guideId, version?)`：清理指定流程进度。

## 步骤生命周期

每个步骤大致按这个顺序执行：

```text
resolve target -> canStart -> beforeDelay -> onEnter -> show overlay
-> wait for completion -> verify -> completeText -> onComplete
-> finishDelay/afterDelay -> clear overlay -> save progress
```

可用扩展点：

- `canStart(context)`：返回 `false` 时跳过当前步骤。
- `onEnter(context)`：显示遮罩前执行，适合打开 UI、锁状态、补业务准备。
- `verify(context)`：步骤完成后校验业务状态，失败会让流程报错。
- `onComplete(context, reason)`：步骤完成后执行，适合发奖励、打点、推进业务。
- `custom.run(context, finish, fail)`：完全自定义异步步骤，业务自己决定何时完成。

`context.manager` 可以主动 `completeCurrentStep()`、`skipCurrentStep()`、`stop()` 或 `emit()`。

## 推荐 guideId

使用业务语义，不使用场景层级。

```text
game.first-box
game.shoot-zone
game.target-pig
home.start-button
level.retry-button
```

不要用：

```text
Canvas/GameRoot/Bottom/Grid/Box_1
Button
box_red_3
```

## 静态节点接入

在 Cocos Creator 中给目标节点挂 `GuideAnchor`：

```text
Box 节点
  GuideAnchor.guideId = game.first-box

射击区域节点
  GuideAnchor.guideId = game.shoot-zone
```

## 动态节点接入

运行时生成节点后注册：

```ts
import { getOrAddGuideAnchor } from './framework/core/guide-next';

getOrAddGuideAnchor(boxNode, 'game.first-box');
```

动态节点如果来自对象池，节点复用时要重新调用 `getOrAddGuideAnchor(node, guideId)`，确保旧的业务 id 不会留在新内容上。

## 代码启动

```ts
import { GuideFlowConfig, GuideService, GuideStepKind, GuideTargetMissPolicy } from './framework/core/guide-next';

const flow: GuideFlowConfig = {
    guideId: 'game.first-play',
    version: 1,
    autoSaveProgress: true,
    steps: [
        {
            kind: GuideStepKind.Tap,
            target: 'game.first-box',
            text: '点击这个箭头盒',
            targetMissPolicy: GuideTargetMissPolicy.Wait,
            passThrough: true,
        },
        {
            kind: GuideStepKind.Drag,
            from: 'game.first-box',
            to: 'game.shoot-zone',
            text: '移动到射击区域',
            passThrough: true,
        },
        {
            kind: GuideStepKind.WaitEvent,
            eventName: 'guide:first-pig-killed',
            timeout: 15,
        },
    ],
};

GuideService.start(flow);
```

## Inspector 配置

如果希望策划或配置人员在 Cocos Inspector 中维护流程，可以把 `GuideFlowComponent` 挂到任意节点上，在 `steps` 数组里配置步骤。启动时直接传组件：

```ts
const flowComponent = node.getComponent(GuideFlowComponent);
GuideService.start(flowComponent);
```

Inspector 版本会把 `targetMissPolicy` 固定为 `Wait`，适合常见 UI 异步打开场景；更复杂的条件、过滤、回调和自定义步骤建议用代码配置。

## 事件步骤

等待事件的步骤使用项目的 `EventManager`：

```ts
import { GuideService } from './framework/core/guide-next';

GuideService.getActiveRunner()?.emit('guide:first-pig-killed');
```

或直接：

```ts
import { EventManager } from './framework/core/services/event/event-manager';

EventManager.instance.emit('guide:first-pig-killed');
```

## 支持的步骤

- `tap`：点击目标。
- `longPress`：长按目标。
- `drag`：从 `from` 拖到 `to`。
- `move`：沿多个 `targets` 滑动。
- `waitEvent`：等待事件。
- `waitSeconds`：等待固定秒数。
- `custom`：业务自定义异步步骤。

## 目标缺失策略

`targetMissPolicy` 决定目标找不到时怎么处理：

- `Wait`：等待目标注册，直到 `waitTargetTimeout`。适合异步加载 UI、动态创建节点。
- `SkipStep`：找不到就跳过当前步骤。适合非关键引导或某些模式下不存在的入口。
- `FailGuide`：找不到就让流程失败。适合必须存在的核心步骤。

默认是 `FailGuide`，Inspector 配置会使用 `Wait`。

## 自定义遮罩

如果默认样式不够，可以实现 `IGuideOverlay` 后通过 `GuideService.start(flow, { overlay })` 传入，或通过 `overlayPrefabPath` 加载 prefab。自定义遮罩只需要负责这些事：

- `showStep(step, snapshots)`：根据步骤和目标快照显示 UI。
- `setTouchHandler(handler)`：把触摸事件交给运行器。
- `showCompleteText(step)`：可选显示完成文案。
- `clearStep()`：清理当前步骤状态。
- `dispose()`：释放遮罩节点。

运行器不关心遮罩具体长什么样，因此项目可以按业务风格替换皮肤。

## 排错清单

- 引导没有出现：确认 `GuideService.start()` 已调用，且当前场景有 `Canvas`，或传入了 `GuideStartOptions.parent`。
- 报 `Guide target missing`：确认目标节点挂了 `GuideAnchor`，`guideId` 拼写一致，节点处于激活状态。
- 动态节点等不到：确认节点创建后调用了 `getOrAddGuideAnchor()`，并检查 `waitTargetTimeout` 是否太短。
- 点目标后业务没响应：检查步骤 `passThrough` 和锚点 `passThrough` 是否为 `true`。
- 点目标外还能操作其它 UI：检查是否把步骤配置成了 `passThrough: true`，目标外默认应该被拦截；强制流程可加 `blockOthers: true`。
- 改了步骤但老账号流程异常：提升 `GuideFlowConfig.version`，或清理本地引导进度。
