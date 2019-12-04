import { Exception } from "./Exception";


"use strict"


export class EntityIsNotDestroyedException extends Exception {
  /**
   * Entity Is Not Destroyed Exception
   * @constructor
   * @param message
   */
  public constructor(message: string) {
    super(message + "\nEntity is not destroyed yet!")
  }
}
