# guide-next 使用说明

本目录是新的新手引导框架，和旧的 `framework/core/guide` 并行存在。维护或接入时只改 `guide-next` 内部文件，不要反向依赖旧引导实现。

## 目录职责

- `guide-types.ts`：对外类型、步骤配置、运行时接口。
- `guide-anchor.ts`：目标锚点组件，挂在需要高亮或点击的真实 UI 节点上。
- `guide-anchor-registry.ts`：全局锚点注册表，负责通过 `guideId` 查找目标。
- `guide-runner.ts`：核心运行器，负责步骤生命周期、触摸判断、事件等待和进度保存。
- `guide-default-overlay.ts`：默认遮罩实现，当前只支持矩形镂空和矩形高亮。
- `guide-flow-component.ts`：Inspector 可配置流程组件。
- `guide-service.ts`：启动入口，保证同一时间只有一条引导运行。
- `guide-storage.ts`：默认本地进度存储。
- `guide-event-bus.ts`：接入项目 `EventManager` 的事件桥。
- `guide-example.ts`：示例流程，不作为正式业务配置来源。

## 接入方式

目标节点必须挂 `GuideAnchor`，并填写稳定的业务语义 `guideId`。不要使用场景路径、节点名或临时生成名作为 `guideId`。

推荐：

```text
main.play-button
game.first-box
game.shoot-zone
level.retry-button
```

不推荐：

```text
Canvas/BGMenu/_PlayBtn
Button
box_1
```

动态节点或对象池节点用代码注册：

```ts
import { getOrAddGuideAnchor } from './framework/core/guide-next';

getOrAddGuideAnchor(node, 'game.first-box');
```

对象池节点复用时必须重新设置 `guideId`，避免旧 id 留在新内容上。

## 启动流程

代码配置优先从 `index.ts` 导入：

```ts
import { GuideFlowConfig, GuideService, GuideStepKind, GuideTargetMissPolicy } from './framework/core/guide-next';
```

正式引导建议：

- `guideId` 使用稳定流程 id。
- 修改步骤数量、顺序或含义后提升 `version`。
- `autoSaveProgress` 保持 `true`。
- 多个步骤共享的 `targetMissPolicy`、`waitTargetTimeout`、`passThrough`、`maskPadding` 等字段优先放在 `GuideFlowConfig.stepDefaults`。
- 默认遮罩共用的手指图、遮罩透明度等字段优先放在 `GuideFlowConfig.overlayDefaults`。
- 代码里判断“能不能起引导”时，优先返回 `GuideStartDecision` 之类的结构化结果，再由业务层打印原因，不要只留一个裸 `boolean`。
- 需要异步等待 UI 出现时，默认还是使用 `targetMissPolicy: GuideTargetMissPolicy.Wait`。
- 排查流程时临时打开 `GuideFlowConfig.debug`，能看到启动、恢复、等待目标、步骤完成和停止日志。
- `GuideService` 只负责启动和遮罩默认值，不要把业务选择逻辑塞进来。
- `guide-flow-utils.ts` 和 `guide-start-decision.ts` 这类纯工具优先写成无场景依赖的小函数，便于 seed-searcher 直接测。

测试引导建议：

- `restartFromBeginning: true`
- `autoSaveProgress: false`
- 使用独立的测试 `guideId`，避免污染正式存档。

## 触摸透传

命中目标时是否让真实 UI 响应，由步骤配置和锚点配置共同决定：

- `GuideAnchor.passThrough = true`：只在命中目标区域时透传，推荐用于按钮引导。
- `step.passThrough = true`：当前步骤触摸都可能透传，包括目标区域外。谨慎使用。
- `step.blockOthers = true`：强制拦截所有触摸。

Cocos 3.8 中，`event.preventSwallow = true` 才表示阻止当前节点吞掉事件，让事件继续派发给下层节点。不要把这个语义改反。

## 遮罩限制

默认 `GuideDefaultOverlay` 使用 `Graphics` 画矩形镂空：

- 支持多个矩形洞。
- 支持矩形高亮边框。
- 不支持真实圆形、椭圆、图片轮廓或羽化。

项目已有 `HoleMask` shader 组件，如需圆形、椭圆、羽化或图片轮廓，优先新增独立的 `GuideHoleMaskOverlay`，不要直接破坏默认 overlay 的矩形多洞兜底能力。

## Inspector 配置

所有暴露给 Cocos Inspector 的 `@property` 必须包含中文 `displayName` 和 `tooltip`，格式参考：

```ts
@property({ displayName: '流程ID', tooltip: '整条引导流程的稳定 id，用于日志和进度存档。不填时使用当前节点名。' })
```

新增 Inspector 字段时必须同步说明：

- 字段用途。
- 默认值含义。
- 常见误用风险。

## 修改守则

- 不要把流程配置绑定到场景层级路径。
- 不要让 `GuideRunner` 直接依赖具体业务 UI。
- 不要在 `GuideDefaultOverlay` 里写业务逻辑。
- 不要默认吞掉目标区域触摸，按钮类引导应支持透传。
- 不要删除 `GuideService` 的单 runner 约束，避免多个遮罩争抢输入。
- 不要改旧 `framework/core/guide` 来适配新框架。

## 验证清单

改动后至少检查：

1. `guide-next` 下所有 `.ts` 文件能通过 TypeScript 转译诊断。
2. `npx tsc --noEmit --pretty false` 的输出中没有 `guide-next` 相关报错。
3. 点击步骤能完成引导。
4. `GuideAnchor.passThrough = true` 时，真实按钮能收到点击。
5. 目标不存在时，`Wait`、`SkipStep`、`FailGuide` 三种策略行为符合预期。
6. 修改步骤顺序或数量后，确认是否需要提升 `GuideFlowConfig.version`。
