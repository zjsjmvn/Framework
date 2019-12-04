// mmgg  不足，， 在购买时需要传入够买的name 或id 。当发布新包时，需要修改配置文件的id，修改购买时的id。
// 这样一个id 存在三个地方（配置文件，InAppPurchaseManager，以及购买调用管理器的地方）。需要三个地方都改对才是对的。很容易疏忽造成错误
let InAppPurchaseManager = cc.Class({
    properties: {},
    statics: {
        getInstance: function () {
            if (!this._instance) this._instance = new this();
            return this._instance;
        }
    },
    ctor() {
        if (cc.sys.isMobile && typeof (sdkbox) !== "undefined") {

            let ShopManager = require("../../@types/ShopManager")

            let self = this;
            sdkbox.IAP.setListener({
                onSuccess: function (product) {
                    //Purchase success
                    cc.log("Purchase successful: " + product.name);
                    self.printProduct(product);

                    ShopManager.getInstance().buySuccess(product.name, product.id);
                    // if(product.id ==="com.MG.RemoveADS"){
                    //     console.log('com.MG.RemoveADS success');
                    //     AdsManager.getInstance().closeAds();

                    //     PlayerManager.getInstance().purchaseNoAdsSuccess();

                    // }else if (product.id === "www.fastgame.org100"){
                    //     //发送全局事件
                    // }else if (product.id === "www.fastgame.org300"){

                    // }else if (product.id === "www.fastgame.org1000"){

                    // }

                },
                onFailure: function (product, msg) {
                    //Purchase failed
                    //msg is the error message
                    cc.log("Purchase failed: " + product.name + " error: " + msg);
                    ShopManager.getInstance().buyFail(product.name, product.id);
                },
                onCanceled: function (product) {
                    cc.log("Purchase canceled: " + product.name);
                    ShopManager.getInstance().buyCancel(product.name, product.id);
                },
                onRestored: function (product) {
                    cc.log("Restored: " + product.id);
                    ShopManager.getInstance().restoredSuccess(product.name, product.id);
                    // if(product.id ==="com.MG.RemoveADS"){
                    //     console.log(' restored com.MG.RemoveADS success');
                    //     AdsManager.getInstance().hideBanner();
                    //     PlayerManager.getInstance().purchaseNoAdsSuccess();
                    // }
                    self.printProduct(product);
                },
                onProductRequestSuccess: function (products) {
                    cc.log("onProductRequestSuccess");
                    for (let i = 0; i < products.length; i++) {
                        cc.log("================");
                        cc.log("name: " + products[i].name);
                        cc.log("price: " + products[i].price);
                        cc.log("priceValue: " + products[i].priceValue);
                        cc.log("================");
                    }
                },
                onProductRequestFailure: function (msg) {
                    cc.log("Failed to get products");
                },
                onShouldAddStorePayment: function (productId) {
                    cc.log("onShouldAddStorePayment:" + productId);
                    return true;
                },
                onFetchStorePromotionOrder: function (productIds, error) {
                    cc.log("onFetchStorePromotionOrder:" + " " + " e:" + error);
                },
                onFetchStorePromotionVisibility: function (productId, visibility, error) {
                    cc.log("onFetchStorePromotionVisibility:" + productId + " v:" + visibility + " e:" + error);
                },
                onUpdateStorePromotionOrder: function (error) {
                    cc.log("onUpdateStorePromotionOrder:" + error);
                },
                onUpdateStorePromotionVisibility: function (error) {
                    cc.log("onUpdateStorePromotionVisibility:" + error);
                },
            });
            sdkbox.IAP.init();
            sdkbox.IAP.setDebug(true);
            sdkbox.IAP.refresh();
        }
    },

    //购买
    purchase: function (name) {
        if (!this._isMobile()) return;
        if (!this._isSdkboxValid()) return;

        sdkbox.IAP.purchase(name);
    },

    //恢复内购
    restore: function () {
        if (!this._isMobile()) return;
        if (!this._isSdkboxValid()) return;

        sdkbox.IAP.restore();
    },

    printProduct: function (p) {
        cc.log("======The product info======");
        cc.log("name=", p.name);
        cc.log("title=", p.title);
        cc.log("description=", p.description);
        cc.log("price=", p.price);
        cc.log("priceValue=", p.priceValue);
        cc.log("currencyCode=", p.currencyCode);
        cc.log("receipt=", p.receipt);
        cc.log("receiptCipheredPayload=", p.receiptCipheredPayload);
        cc.log("transactionID=", p.transactionID);
        cc.log("");
    },

    _isMobile: function () {
        if (cc.sys.isMobile) {
            return true;
        }
        return false;
    },
    _isSdkboxValid() {
        if (typeof (sdkbox) !== "undefined") {
            return true;
        }
        return false;
    }
});

module.exports = InAppPurchaseManager;

window.plug = window.plug || {};
window.plug.InAppPurchaseManager = InAppPurchaseManager;