"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponType = exports.RefundStatus = exports.PaymentMethodType = exports.PaymentStatus = exports.OrderStatus = exports.AddressType = exports.CartStatus = exports.ProductStatus = void 0;
// Enum definitions to use until Prisma client is generated
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "DRAFT";
    ProductStatus["ACTIVE"] = "ACTIVE";
    ProductStatus["INACTIVE"] = "INACTIVE";
    ProductStatus["ARCHIVED"] = "ARCHIVED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var CartStatus;
(function (CartStatus) {
    CartStatus["ACTIVE"] = "ACTIVE";
    CartStatus["ABANDONED"] = "ABANDONED";
    CartStatus["CONVERTED"] = "CONVERTED";
})(CartStatus || (exports.CartStatus = CartStatus = {}));
var AddressType;
(function (AddressType) {
    AddressType["SHIPPING"] = "SHIPPING";
    AddressType["BILLING"] = "BILLING";
})(AddressType || (exports.AddressType = AddressType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["CONFIRMED"] = "CONFIRMED";
    OrderStatus["PROCESSING"] = "PROCESSING";
    OrderStatus["SHIPPED"] = "SHIPPED";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CARD"] = "CARD";
    PaymentMethodType["BANK_ACCOUNT"] = "BANK_ACCOUNT";
    PaymentMethodType["DIGITAL_WALLET"] = "DIGITAL_WALLET";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
var RefundStatus;
(function (RefundStatus) {
    RefundStatus["PENDING"] = "PENDING";
    RefundStatus["PROCESSING"] = "PROCESSING";
    RefundStatus["COMPLETED"] = "COMPLETED";
    RefundStatus["FAILED"] = "FAILED";
})(RefundStatus || (exports.RefundStatus = RefundStatus = {}));
var CouponType;
(function (CouponType) {
    CouponType["PERCENTAGE"] = "PERCENTAGE";
    CouponType["FIXED_AMOUNT"] = "FIXED_AMOUNT";
    CouponType["FREE_SHIPPING"] = "FREE_SHIPPING";
})(CouponType || (exports.CouponType = CouponType = {}));
