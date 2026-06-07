# Framework ECS 使用说明

`libs/ecs` 是项目当前使用的 TypeScript ECS 框架。它借鉴了 Entitas 的组件、实体、Matcher、Group、System 思路，但不是 Entitas 直搬：这里没有代码生成、Context、Collector、cleanup attribute，也没有字段级 replaced 事件。

适用目标：

- 纯逻辑可在 Node 测试中运行。
- 战斗逻辑可以脱离 Cocos View/UI 单独跑。
- 未来可以把同一套逻辑放到 AI 模拟或权威服务器。
- View/UI 只消费快照、delta 或领域事件，不直接承载核心规则。

更多 MOBA/权威服务器/AI 测试模式见同目录的 `moba-combat-pattern.md`。

## 组件

组件必须继承 `ECS.Component`，并用稳定名字注册。不要依赖类名，因为打包压缩后类名可能变化。

```ts
@ECS.register("Position")
export class PositionComponent extends ECS.Component {
    x = 0;
    y = 0;

    init(): void {
        this.x = 0;
        this.y = 0;
    }
}
```

`init()` 不是首次添加时的初始化函数，而是组件回收前的重置函数。组件从池里复用时，旧数组、Map、函数、节点引用、实体 id 都可能还在，所以 `init()` 要清干净引用和脏数据。

如果组件对象由 Cocos 或外部系统创建，ECS 不能 `new`，注册时使用：

```ts
@ECS.register("View", false)
export class ViewComponent extends Component {
    // Cocos component lifecycle is owned by Cocos.
}
```

这类外部对象挂到实体上后，生命周期仍由创建方负责，ECS 不负责回收实例。

## 实体

实体使用手写 TypeScript 类型提示，不使用 Entitas 代码生成。

```ts
export class ActorEntity extends ECS.Entity {
    Position!: PositionComponent;
    Velocity!: VelocityComponent;
    Health!: HealthComponent;
    View?: ViewComponent;
}
```

这些属性只是告诉 TypeScript：当实体运行时挂上对应组件后，可以通过 `entity.Position` 访问。真正注册组件的是 `@ECS.register("Position")`，真正添加组件的是 `entity.add(PositionComponent)`。

创建和销毁：

```ts
const actor = ECS.createEntity<ActorEntity>();
actor.add(PositionComponent);
actor.add(VelocityComponent);
actor.add(HealthComponent);

actor.destroy();
```

常用操作：

```ts
const position = actor.get(PositionComponent);
const hasHealth = actor.has(HealthComponent);

actor.remove(VelocityComponent);
actor.remove(HealthComponent, false);
```

`remove(Component, false)` 会让组件从匹配关系中移除，但对象留在实体的缓存里，下次重新添加时复用原对象。只有确实需要保留大对象或临时状态时才使用，并给这种行为写测试。

## Matcher 和 Group

Matcher 是 ECS 的查询语言，Group 是缓存后的匹配实体集合。

```ts
ECS.allOf(PositionComponent, VelocityComponent);
ECS.anyOf(StunComponent, SlowComponent);
ECS.allOf(PositionComponent, HealthComponent).excludeOf(DeadComponent);
ECS.allOf(PositionComponent).anyOf(VelocityComponent, MoveInputComponent).excludeOf(StunComponent);
```

规则语义：

- `allOf(A, B)`：同时拥有 A 和 B。
- `anyOf(A, B)`：拥有 A 或 B 任意一个。
- `excludeOf(A, B)`：不同时拥有这里列出的排除条件。
- `onlyOf(A, B)`：只拥有这些组件，监听面很广，非特殊情况不要使用。

推荐把 Matcher 当作粗筛。队伍、距离、隐身/显形、无敌、护盾、技能优先级等字段级规则放在 System 里判断。

查询：

```ts
const movers = ECS.query<ActorEntity>(
    ECS.allOf(PositionComponent, VelocityComponent).excludeOf(DeadComponent)
);

const game = ECS.querySingle<GameEntity>(ECS.allOf(GameStateComponent));
```

`querySingle()` 适合唯一实体：没有匹配返回 `null`，匹配超过一个会抛错。

等价 Matcher 会复用同一个 Group；新 Group 创建时会扫描已有实体，所以系统晚于实体创建也能看到已存在的匹配实体。

## System

`ComblockSystem` 是最常用的系统基类。`update`、`entityEnter`、`entityRemove`、`firstUpdate` 的参数都是实体数组，不是单个实体。

```ts
class MovementSystem extends ECS.ComblockSystem<ActorEntity> {
    filter(): ECS.IMatcher {
        return ECS.allOf(PositionComponent, VelocityComponent).excludeOf(StunComponent, DeadComponent);
    }

    update(entities: ActorEntity[]): void {
        for (const entity of entities) {
            entity.Position.x += entity.Velocity.x * this.dt;
            entity.Position.y += entity.Velocity.y * this.dt;
        }
    }
}
```

进入/移除匹配组：

```ts
class SpawnViewEventSystem extends ECS.ComblockSystem<ActorEntity> {
    filter(): ECS.IMatcher {
        return ECS.allOf(PositionComponent, HealthComponent);
    }

    entityEnter(entities: ActorEntity[]): void {
        for (const entity of entities) {
            // 记录领域事件或同步数据，不要在核心逻辑里创建 Cocos 节点。
        }
    }

    entityRemove(entities: ActorEntity[]): void {
        for (const entity of entities) {
            // 清理逻辑侧引用或输出 despawn 事件。
        }
    }

    update(_entities: ActorEntity[]): void {
    }
}
```

执行顺序由 `RootSystem` 或 `ECS.System` 明确决定：

```ts
const root = new ECS.RootSystem();
root
    .add(new StatusTimerSystem())
    .add(new MovementSystem())
    .add(new AttackSystem())
    .add(new DamageSystem())
    .add(new DeathSystem())
    .add(new ECS.DestroySystem(ECS.allOf(DamageRequestComponent)));

root.init();
root.execute(fixedDt);
```

`RootSystem.clear()` 会释放 root 持有的系统，并调用系统 `onDestroy()` 解绑 Group 监听；它不会销毁实体。完整结束一个 ECS 世界时使用：

```ts
root.clear();
ECS.clear();
```

## ReactiveSystem

当前 ECS 有轻量 `ReactiveSystem`，用于响应实体进入或离开某个 Matcher。

```ts
class DeathEventSystem extends ECS.ReactiveSystem<ActorEntity> {
    trigger(): ECS.TriggerOnEvent {
        return ECS.onAdded(ECS.allOf(DeadComponent));
    }

    protected ensure(): ECS.IMatcher | null {
        return ECS.allOf(HealthComponent);
    }

    executeReactive(entities: ActorEntity[]): void {
        for (const entity of entities) {
            // 输出死亡事件、记日志、生成一帧请求等。
        }
    }
}
```

可用触发：

- `ECS.onAdded(matcher)`
- `ECS.onRemoved(matcher)`
- `ECS.onAddedOrRemoved(matcher)`

`ensure()` 和 `exclude()` 是触发后的二次过滤。它们不会变成字段级监听，也不会因为 `Health.hp` 这样的字段变化而触发。需要值变化响应时，用显式 dirty/tag/request 组件表达。

## 一帧命令和清理

输入、技能释放、伤害、Buff 申请等短生命周期意图建议用 request entity。

```ts
const requestEntity = ECS.createEntity();
const request = requestEntity.add(DamageRequestComponent);
request.sourceEid = attacker.eid;
request.targetEid = target.eid;
request.amount = 100;
```

处理后在流水线末尾清掉：

```ts
root.add(new DamageSystem());
root.add(new ECS.DestroySystem(ECS.allOf(DamageRequestComponent)));
```

如果只是移除一个一次性组件，可以用：

```ts
root.add(new ECS.RemoveComponentSystem(
    ECS.allOf(MoveInputRequestComponent),
    MoveInputRequestComponent
));
```

不要让 `DamageRequest`、`CastRequest`、`MoveInputRequest`、`BuffApplyRequest` 这类一帧意图长期留在世界里。

## View/UI 边界

核心 ECS 只做数据和逻辑计算。UI 和显示不要放进 ECS 流水线里。

推荐分层：

- Cocos View：负责节点、预制体、动画、音效、点击、弹窗、插值显示。
- Presenter/ViewModel：把 ECS 快照、delta、领域事件转换成界面显示数据。
- Runtime/Facade：接收 UI 输入，创建 command/request，固定 tick 驱动 ECS，导出快照和事件。
- ECS Systems：只处理纯逻辑，不访问 Cocos API、UIManager、tween、audio、prefab。

输入方向：

```text
UI click/input -> Runtime facade -> command/request entity -> ordered ECS systems
```

输出方向：

```text
ECS state/events -> snapshot/delta/domain events -> Presenter -> Cocos View
```

这能保证逻辑可以在本地 Node 测试、AI 模拟和服务器环境里运行。

## MOBA 战斗建议

MOBA 或类似实时战斗建议按小组件拆分：

- 耐久数据：`Identity/NetId`、`Position`、`Velocity`、`Team`、`Health`、`Attack`、`Mana`、`SkillCooldown`。
- 状态标签/计时：`Dead`、`Stun`、`Slow`、`Invisible`、`Revealed`、`Untargetable`、`Invulnerable`、`Respawn`。
- 一帧命令：`MoveInputRequest`、`CastRequest`、`DamageRequest`、`BuffApplyRequest`、`DispelRequest`。
- 运行时对象：`Projectile`。
- 策略数值：`BuffState`、小型 stat 组件，或 `NumericComponent`。

推荐帧顺序：

```text
Cooldown/status timers -> Movement -> Targeting/Attack -> Cast command -> Projectile -> Damage -> Death -> Respawn -> Cleanup
```

网络和回放不要依赖 ECS `eid` 作为业务身份。`eid` 是运行时对象 id，快照、预测、服务器同步应使用稳定的 `Identity` 或 `NetId`。

## NumericComponent

`NumericComponent` 用于可叠加数值。不要直接累加 `Base` 或 `Final`。

使用方式：

```ts
numeric.setByKey(NumericType.Base, 100);
numeric.addByKey(NumericType.BaseAddValue, 20);
numeric.addByKey(NumericType.BaseAddPercent, 15);
numeric.update();

const finalValue = numeric.Final;
```

公式：

```text
((Base + BaseAddValue) * (100 + BaseAddPercent) / 100 + FinalAddValue) * (100 + FinalAddPercent) / 100
```

百分比低于 `-100` 会产生反向或异常结果，当前实现会警告。

## 性能和生命周期

常见性能规则：

- 组件保持小而清晰，避免一个巨型组件承载所有状态。
- 高频对象用组件池和实体池，不要在每帧创建大量临时普通对象。
- 用 Matcher/Group 做组件存在性的缓存查询，不要每帧手写全世界扫描。
- `onlyOf` 和无锚点的宽泛 `excludeOf` 谨慎使用。
- 一帧命令处理完立刻清理，避免世界里积累无效实体。
- Group 复用是正常优化，多个系统使用等价 Matcher 时各自仍有独立 enter/remove 缓冲。

对象池持有实体或组件内存是预期缓存行为，不等于泄漏。真正需要排查的是：

- `RootSystem.clear()` 后旧系统仍被执行。
- 旧系统仍挂在 Group watcher 上。
- View 节点或 Cocos Component 被核心组件长期引用。
- 一帧 request entity 没有销毁。
- 逻辑世界结束时只 `root.clear()`，忘了 `ECS.clear()`。

## 测试入口

ECS 相关修改优先跑：

```powershell
npm run test:ecs
```

需要和旧 Entitas 行为或性能对比时跑：

```powershell
npm run test:ecs:compare
```

覆盖重点：

- 组件注册、add/remove/destroy、组件池 reset。
- `allOf/anyOf/excludeOf/onlyOf` 及组合 matcher。
- 等价 matcher 的 group 复用。
- 已存在实体创建 group 后能被扫描到。
- `entityEnter/entityRemove/firstUpdate` 顺序。
- `ReactiveSystem` 的 added/removed/ensure/exclude。
- `DestroySystem`、`RemoveComponentSystem` 清理一帧命令。
- `RootSystem.clear()` 不残留 watcher，完整世界结束配合 `ECS.clear()`。
- MOBA 场景中的减速、眩晕、死亡、复活、护盾、吸血、反伤、投射物失效、预测回放。
