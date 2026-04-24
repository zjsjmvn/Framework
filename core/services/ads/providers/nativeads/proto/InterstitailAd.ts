/*
 Copyright (c) 2023-2024 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 of the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

import { Base } from "./Base";
import { AdError, LoadAdError } from "../ads/alias/TypeAlias";
import { IAdError, ILoadAdError } from "./ICallbackNTF";
import { _decorator  } from "cc";
const { ccclass } = _decorator;

@ccclass("AdsLoadInterstitialAdREQ")
export class AdsLoadInterstitialAdREQ extends Base{

}

@ccclass("AdsShowInterstitialAdREQ")
export class AdsShowInterstitialAdREQ extends Base{

}

@ccclass("AdsInterstitialAdLoadCalLBackNTF")
export class AdsInterstitialAdLoadCalLBackNTF extends Base implements ILoadAdError{
    method:string;
    loadAdError:LoadAdError;
}

@ccclass("AdsInterstitialFullScreenContentCallbackNTF")
export class AdsInterstitialFullScreenContentCallbackNTF extends Base implements IAdError{
    method:string;
    adError:AdError;
}
