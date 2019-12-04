import { Exception } from "./Exception";
import { Pool } from "../Pool";


"use strict";

export class EntityAlreadyHasComponentException extends Exception {
  /**
   * Entity Already Has Component Exception
   * @constructor
   * @param message
   * @param index
   */
  public constructor(message: string, index: number) {
    super(message + "\nEntity already has a component at index (" + index + ") " + Pool.componentsEnum[index]);
  }
}

