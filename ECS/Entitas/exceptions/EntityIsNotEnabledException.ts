import { Exception } from "./Exception";


"use strict"


export class EntityIsNotEnabledException extends Exception {
  /**
   * Entity Is Not Enabled Exception
   * @constructor
   * @param message
   */
  public constructor(message: string) {
    super(message + "\nEntity is not enabled")
  }
}
