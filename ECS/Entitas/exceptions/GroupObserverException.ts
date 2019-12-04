import { Exception } from "./Exception";

"use strict"


export class GroupObserverException extends Exception {
  /**
   * Group Observer Exception
   * @constructor
   * @param message
   */
  public constructor(message: string) {
    super(message)
  }
}

