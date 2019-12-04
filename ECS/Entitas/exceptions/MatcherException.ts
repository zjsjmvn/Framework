import { Exception } from "./Exception";
import { IMatcher } from "../interfaces/IMatcher";


"use strict"


export class MatcherException extends Exception {
  /**
   * Matcher Exception
   * @constructor
   * @param matcher
   */
  public constructor(matcher: IMatcher) {
    super("matcher.indices.length must be 1 but was " + matcher.indices.length)
  }
}

