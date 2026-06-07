# MOBA Combat Pattern for Framework ECS

This document records a reusable ECS shape for MOBA-like combat, headless AI tests, and authoritative server simulation. It uses the local TypeScript ECS rewrite, not Entitas code generation.

Runnable references:

- `test/ecs-moba-scenarios.test.ts` covers current ECS combat pipeline behavior.
- `test/ecs-comparison.bench.ts` compares current ECS and the old Entitas implementation.
- Run with `npm run test:ecs` and `npm run test:ecs:compare`.

## Goals

- Keep combat logic Cocos-free.
- Run the same logic in local tests, AI simulation, and an authoritative server.
- Treat view changes as output snapshots, deltas, or domain events.
- Use stable logical ids such as `Identity` or `NetId` for snapshots. Do not rely on ECS `eid` for network identity.

## Component Slices

Durable unit data:

- `Identity` or `NetId`
- `Position`
- `Velocity`
- `Team`
- `Health`
- `Attack`
- `Mana`
- `SkillCooldown`

State tags and timers:

- `Dead`
- `Stun`
- `Slow`
- `Invisible`
- `Revealed`
- `Untargetable`
- `Invulnerable`
- `Respawn`

Transient command/request entities:

- `MoveInputRequest`
- `CastRequest`
- `DamageRequest`
- `BuffApplyRequest`
- `DispelRequest`

Runtime objects:

- `Projectile`

Strategy/stat data:

- `BuffState`
- Small stat components
- `NumericComponent` for stacked Base/BaseAdd/FinalAdd style stats

## Typed Entity Shape

Use handwritten TypeScript typing. The properties are type hints for components attached at runtime; they are not registration or code generation.

```ts
export class MobaUnitEntity extends ECS.Entity {
    Identity!: IdentityComponent;
    Position!: PositionComponent;
    Velocity!: VelocityComponent;
    Team!: TeamComponent;
    Health!: HealthComponent;
    Attack!: AttackComponent;
    Dead!: DeadComponent;
    Stun!: StunComponent;
    Slow!: SlowComponent;
}
```

## Frame Order

Use fixed ticks for deterministic combat. Keep system order explicit:

```text
Cooldown/status timers
Movement
Targeting/Attack
Cast command
Projectile
Damage
Death
Respawn
Cleanup
```

Cleanup means destroying or removing one-frame request components at a terminal point, usually with `DestroySystem` or `RemoveComponentSystem`.

## Matcher Patterns

Use matchers as coarse component gates. Do field-level checks inside systems.

```ts
ECS.allOf(Position, Velocity).excludeOf(Stun, Dead);
ECS.allOf(Position, Team, Attack).excludeOf(Dead, Stun);
ECS.allOf(Position, Team, Health).excludeOf(Dead);
ECS.allOf(DamageRequest);
ECS.allOf(Projectile, Position);
```

Field-level rules that belong inside systems:

- team/faction checks
- distance and range checks
- invisible/revealed
- untargetable
- invulnerable
- shield/lifesteal/reflect
- slow multiplier
- buff priority and dispel rules

## Movement and Status

Movement should read status components but keep status countdown in a separate system.

```ts
class MovementSystem extends ECS.ComblockSystem<MobaUnitEntity> {
    filter(): ECS.IMatcher {
        return ECS.allOf(Position, Velocity).excludeOf(Stun, Dead);
    }

    update(entities: MobaUnitEntity[]): void {
        for (const entity of entities) {
            const multiplier = entity.has(Slow) ? entity.Slow.multiplier : 1;
            entity.Position.x += entity.Velocity.x * multiplier * this.dt;
            entity.Position.y += entity.Velocity.y * multiplier * this.dt;
        }
    }
}
```

Decide status timer order intentionally. If the timer runs before movement, an effect that expires this tick may not affect movement this tick. If movement runs before the timer, the effect affects its final tick.

## Commands and Cleanup

Use request entities for one-frame intent:

```ts
const entity = ECS.createEntity();
const request = entity.add(DamageRequest);
request.sourceEid = source.eid;
request.targetEid = target.eid;
request.amount = damage;

root.add(new DamageSystem());
root.add(new ECS.DestroySystem(ECS.allOf(DamageRequest)));
```

Do not leave `CastRequest`, `DamageRequest`, `BuffApplyRequest`, or `MoveInputRequest` in the world after the frame that consumes them.

## Damage Pipeline

A stable MOBA damage order is easier to test and replay:

```text
validate target -> invulnerable -> shield -> health damage -> lifesteal -> reflect -> death
```

Represent damage as requests, not direct view calls. `DamageSystem` mutates health; `DeathSystem` adds `Dead`; a final cleanup system destroys requests.

## Authority and Prediction

For a server-authoritative or replayable runtime:

1. Import authoritative snapshot by logical `Identity` or `NetId`.
2. Drop acknowledged local inputs.
3. Recreate or patch durable ECS components.
4. Replay pending `MoveInputRequest` and `CastRequest`.
5. Export snapshot/delta/domain events for the Presenter.

Never keep Cocos nodes, tweens, audio, UI state, or prefab references in core combat components.

## Tests to Keep

MOBA-capable ECS work should cover:

- movement with `Stun` and `Slow`
- target filtering for team, range, dead, invisible, revealed, untargetable
- projectile target invalidation
- damage requests and cleanup
- shield, lifesteal, reflect, invulnerable
- death and respawn re-entering matchers
- buff stack, refresh, dispel, and expiry
- fixed tick replay by logical identity
- large transient command churn
- current ECS vs old Entitas behavior comparison when changing matcher/system behavior

## Lifecycle Notes

`RootSystem.clear()` releases systems but does not destroy ECS entities. Use both when a full combat world ends:

```ts
root.clear();
ECS.clear();
```

Pooled entities and pooled components retaining memory is expected cache behavior. A real leak is a stale system, watcher, view node, or command entity retaining references after the owning world has ended.
