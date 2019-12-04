import { ISystem } from "./ISystem";
import { Entity } from "../Entity";
import { TriggerOnEvent } from "../TriggerOnEvent";
import { IMatcher } from "./IMatcher";


export interface IReactiveExecuteSystem extends ISystem {
  execute(entities: Array<Entity>)
}

export interface IMultiReactiveSystem extends IReactiveExecuteSystem {
  triggers: Array<TriggerOnEvent>
}

export interface IReactiveSystem extends IReactiveExecuteSystem {
  trigger: TriggerOnEvent
}

export interface IEnsureComponents {
  ensureComponents: IMatcher
}

export interface IExcludeComponents {
  excludeComponents: IMatcher
}

export interface IClearReactiveSystem {
  clearAfterExecute: boolean
}


