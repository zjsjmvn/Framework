import { Exception } from "./Exception";
import { IMatcher } from "../interfaces/IMatcher";


"use strict"


export class SingleEntityException extends Exception {
  /**
   * Single Entity Exception
   * @constructor
   * @param matcher
   */
  public constructor(matcher: IMatcher) {
    super("Multiple entities exist matching " + matcher)
  }
}
