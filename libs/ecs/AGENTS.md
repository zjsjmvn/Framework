# libs/ecs 目录开发约定

本目录是项目的 TypeScript ECS 框架。它是底层运行时基础设施，修改组件注册、实体回收、查询匹配或系统执行顺序时，必须评估所有玩法系统和工具脚本的影响。

## 目录职责

- `ecs.ts`：核心 ECS，实现 Entity、Component、Matcher、Group、System、RootSystem。
- `entity-link.ts`：Cocos 节点组件与 ECS 实体 `eid` 的桥接。
- `numeric-component.ts`：基础数值计算组件。
- `ecs.md`：历史使用说明。
- `moba-combat-pattern.md`：MOBA/权威服务器/AI 测试向的 ECS 战斗流水线参考，包括组件拆分、系统顺序、命令清理、预测回放和测试覆盖建议。

## 组件规则

- 自定义组件必须继承 `ECS.Component`。
- 组件必须使用 `@ECS.register('StableName')` 注册，注册名要稳定，不能依赖压缩后的类名。
- Cocos Component 或外部创建对象不能由 ECS new 时，使用 `@ECS.register('StableName', false)`。
- `init()` 是组件回收前重置方法，不是首次添加初始化方法。
- `init()` 必须清理引用和脏数据，除非能保证复用前所有字段都会被重新赋值。
- 不要直接 `new` 普通 ECS 组件再交给 ECS 期望自动回收；外部对象会 `canRecycle=false`。
- 外部组件对象的生命周期由创建方负责。

## 实体规则

- 创建实体使用 `ECS.createEntity`、`createEntityWithComp`、`createEntityWithComps`。
- 销毁实体使用 `entity.destroy()`，它会移除组件并回收到实体池。
- `entity.add(Component)` 会优先从组件池复用实例。
- `entity.add(obj)` 会把外部对象挂到实体上，但不负责回收该对象。
- `entity.remove(Component, true)` 会调用组件 `init()` 并回收到组件池。
- `entity.remove(Component, false)` 会把组件对象留在实体缓存中，下次重新添加时复用原对象。
- 不要手动修改 `entity.eid`、`mask`、`componentTid2Ctor` 等内部状态。

## 查询与匹配

- 常用筛选使用 `allOf`、`anyOf`、`excludeOf`。
- `onlyOf` 会监听所有组件添加/删除，非特殊情况不要使用。
- Matcher 组合是与关系，例如 `allOf(A, B).excludeOf(C)` 表示有 A/B 且没有 C。
- Matcher 的监听组件索引会去重；等价 matcher 会复用同一个 cached group，避免重复维护实体集合。
- 新增 tag 使用 `registerTag()`，tag 也是组件类型 id，会参与匹配和广播。
- `ECS.query(matcher)` 会创建或复用 group，并返回当前匹配实体数组。
- `ECS.querySingle(matcher)` 用于最多一个实体的场景：无匹配返回 `null`，多个匹配会抛错。
- 新 group 创建时会静默扫描已有实体；系统晚于实体创建时也能在 `update/firstUpdate` 中看到已有匹配实体。

## 系统规则

- `ComblockSystem.update(entities)` 的参数是实体数组，不是单个实体。
- `entityEnter(entities)` 和 `entityRemove(entities)` 也按数组语义处理。
- `entityRemove` 在 `entityEnter` 前执行，然后才执行 `update`。
- `firstUpdate(entities)` 只在系统第一次有实体更新前执行一次。
- `filter()` 返回 matcher 后，系统会基于 group 自动响应组件增删。
- 多个系统使用等价 matcher 时会共享 group，但各自保留独立的 `entityEnter/entityRemove` 缓冲。
- 通用系统可通过 `ComblockSystem` 构造参数传入 matcher；这适合 cleanup/destroy 这类不需要子类字段参与 filter 的系统。
- 需要只响应实体进入/离开 matcher 时，优先用轻量 `ReactiveSystem`：`trigger()` 返回 `onAdded/onRemoved/onAddedOrRemoved`，`executeReactive(entities)` 处理本次收集到的实体。
- `ReactiveSystem` 会缓存 `trigger()` 返回值，避免每次 enter/remove 都重建 matcher。
- 帧末清理优先使用 `DestroySystem(matcher)` 或 `RemoveComponentSystem(matcher, componentType)`，不要把一次性 request/tag 长期留在世界里。
- `ReactiveSystem.ensure()` 和 `ReactiveSystem.exclude()` 可做二次过滤；它们只过滤已被 trigger 收集的实体，不会监听字段值变化。
- 当前 ECS 没有 Entitas 代码生成、Context、Collector 或字段级 replaced 事件；需要“值变化”响应时，用显式 dirty/tag/request 组件表达。
- `RootSystem.add(System)` 会摊平嵌套 System，减少执行层级。
- `RootSystem.clear()` 会调用系统 `onDestroy()` 并释放 root 持有的系统列表；清理实体要用 `ECS.clear()`。

## EntityLink

- `EntityLink.link(eid)` 只保存实体 id。
- `getEntity<T>()` 会通过 `ECS.getEntityByEid` 查找实体；实体已销毁时要允许返回空。
- 节点销毁或对象池复用时，应同步 `unlink()` 或重新 `link()`。

## NumericComponent

- `NumericType.Base` 和 `NumericType.Final` 不允许通过 `addByKey` 累加。
- 使用 `setByKey` 修改 Base、BaseAddValue、BaseAddPercent、FinalAddValue、FinalAddPercent。
- `update()` 公式为：`((Base + BaseAddValue) * (100 + BaseAddPercent) / 100 + FinalAddValue) * (100 + FinalAddPercent) / 100`。
- 百分比低于 `-100` 会让基础值出现反向或异常，当前会警告。

## 修改与验证

- 改组件池：验证 add/remove/destroy 后组件字段被重置，且外部组件不会被错误回收。
- 改 matcher/group：验证实体增删组件后 `query`、`entityEnter`、`entityRemove` 的结果，并覆盖 matcher 索引去重、等价 matcher group 复用和已有实体扫描。
- 改系统执行：验证 `firstUpdate`、`entityRemove`、`entityEnter`、`update` 顺序，以及 `ReactiveSystem` 的 added/removed/ensure/exclude 行为。
- 需要和旧 Entitas 做行为或性能对比时，运行根项目 `npm run test:ecs:compare`；该脚本会以 `--transpile-only` 加载旧 Entitas，不属于默认严格测试入口。
- 改 `ECS.clear()`：验证实体、group、广播监听都被清理，后续重新创建系统仍可工作。
- 改 `NumericComponent`：用脚本覆盖基础值、加值、百分比和 reset。
