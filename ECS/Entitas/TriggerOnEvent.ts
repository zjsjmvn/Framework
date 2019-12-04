"use strict"

import { IMatcher } from "./interfaces/IMatcher";
import { GroupEventType } from "./Matcher";

export class TriggerOnEvent {
  /**
   * @constructor
   *
   * @param trigger
   * @param eventType
   */
  constructor(public trigger: IMatcher, public eventType: GroupEventType) { }
}
