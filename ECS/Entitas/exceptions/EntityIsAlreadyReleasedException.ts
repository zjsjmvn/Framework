import { Exception } from "./Exception";


"use strict"
export class EntityIsAlreadyReleasedException extends Exception {
  /**
   * Entity Is Already Released Exception
   * @constructor
   */
  public constructor() {
    super("Entity is already released!")
  }
}
