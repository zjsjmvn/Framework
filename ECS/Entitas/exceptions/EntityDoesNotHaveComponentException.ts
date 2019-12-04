import { Exception } from "./Exception";
import { Pool } from "../Pool";


"use strict";


export class EntityDoesNotHaveComponentException extends Exception {
  /**
   * Entity Does Not Have Component Exception
   * @constructor
   * @param message
   * @param index
   */
  public constructor(message: string, index: number) {
    super(message + "\nEntity does not have a component at index (" + index + ") " + Pool.componentsEnum[index]);
  }
}

