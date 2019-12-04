import { IExecuteSystem } from "./interfaces/IExecuteSystem";
import { IReactiveExecuteSystem, IMultiReactiveSystem, IReactiveSystem } from "./interfaces/IReactiveSystem";
import { IMatcher } from "./interfaces/IMatcher";
import { GroupObserver } from "./GroupObserver";
import { Entity } from "./Entity";
import { TriggerOnEvent } from "./TriggerOnEvent";
import { Pool } from "./Pool";

"use strict"


/**
 * As
 * Retuns the object if it implements the interface, else null
 *
 * @param object
 * @param method
 * @returns Object
 */
function as(object, method: string) {
  return method in object ? object : null
}

export class ReactiveSystem implements IExecuteSystem {

  /**
   * Get subsystems
   * @type {entitas.IReactiveExecuteSystem}
   * @name entitas.Pool#subsystem */
  public get subsystem(): IReactiveExecuteSystem { return this._subsystem; }

  private _subsystem: IReactiveExecuteSystem
  public _observer: GroupObserver
  public _ensureComponents: IMatcher
  public _excludeComponents: IMatcher
  public _clearAfterExecute: boolean
  public _buffer: Array<Entity>

  /**
   * @constructor
   *
   * @param pool
   * @param subSystem
   */
  constructor(pool: Pool, subSystem: IReactiveSystem | IMultiReactiveSystem) {


    const triggers: Array<TriggerOnEvent> = 'triggers' in subSystem ? subSystem['triggers'] : [subSystem['trigger']]
    this._subsystem = subSystem


    const ensureComponents = as(subSystem, 'ensureComponents')
    if (ensureComponents != null) {
      this._ensureComponents = ensureComponents.ensureComponents
    }
    const excludeComponents = as(subSystem, 'excludeComponents')
    if (excludeComponents != null) {
      this._excludeComponents = excludeComponents.excludeComponents
    }

    this._clearAfterExecute = as(subSystem, 'clearAfterExecute') != null

    const triggersLength = triggers.length
    const groups = new Array(triggersLength)
    const eventTypes = new Array(triggersLength)
    for (let i = 0; i < triggersLength; i++) {
      const trigger = triggers[i]
      groups[i] = pool.getGroup(trigger.trigger)
      eventTypes[i] = trigger.eventType
    }
    this._observer = new GroupObserver(groups, eventTypes)
    this._buffer = []
  }

  public activate() {
    this._observer.activate()
  }

  public deactivate() {
    this._observer.deactivate()
  }

  public clear() {
    this._observer.clearCollectedEntities()
  }


  /**
   * execute
   */
  public execute() {

    const collectedEntities = this._observer.collectedEntities
    const ensureComponents = this._ensureComponents
    const excludeComponents = this._excludeComponents
    const buffer = this._buffer
    let j = buffer.length


    if (Object.keys(collectedEntities).length != 0) {
      if (ensureComponents) {
        if (excludeComponents) {
          for (let k in collectedEntities) {
            const e = collectedEntities[k]
            if (ensureComponents.matches(e) && !excludeComponents.matches(e)) {
              buffer[j++] = e.addRef()
            }
          }
        } else {
          for (let k in collectedEntities) {
            const e = collectedEntities[k]
            if (ensureComponents.matches(e)) {
              buffer[j++] = e.addRef()
            }
          }
        }
      } else if (excludeComponents) {
        for (let k in collectedEntities) {
          const e = collectedEntities[k]
          if (!excludeComponents.matches(e)) {
            buffer[j++] = e.addRef()
          }
        }
      } else {
        for (let k in collectedEntities) {
          const e = collectedEntities[k]
          buffer[j++] = e.addRef()
        }
      }

      this._observer.clearCollectedEntities()
      if (buffer.length != 0) {
        this._subsystem.execute(buffer)
        for (let i = 0, bufferCount = buffer.length; i < bufferCount; i++) {
          buffer[i].release()
        }
        buffer.length = 0
        if (this._clearAfterExecute) {
          this._observer.clearCollectedEntities()
        }
      }
    }

  }
}
