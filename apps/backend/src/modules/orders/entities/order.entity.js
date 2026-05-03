"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = exports.DeliveryStatus = exports.PaymentStatus = exports.OrderStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../user/entities/user.entity");
const offer_entity_1 = require("../../market/entities/offer.entity");
const conversation_entity_1 = require("../../chat/entities/conversation.entity");
const order_card_entity_1 = require("./order-card.entity");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["IN_PROGRESS"] = "in_progress";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["DISPUTED"] = "disputed";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["SHIPPED"] = "shipped";
    DeliveryStatus["DELIVERED"] = "delivered";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
let Order = class Order {
    // Métodos helpers
    isBothConfirmed() {
        return this.buyerConfirmed && this.sellerConfirmed;
    }
    canBeMarkedCompleted() {
        return this.paymentStatus === PaymentStatus.PAID &&
            this.deliveryStatus === DeliveryStatus.DELIVERED;
    }
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.buyOrders),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], Order.prototype, "buyer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.sellOrders),
    __metadata("design:type", typeof (_b = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _b : Object)
], Order.prototype, "seller", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => offer_entity_1.Offer, offer => offer.orders),
    __metadata("design:type", offer_entity_1.Offer)
], Order.prototype, "offer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING }),
    __metadata("design:type", String)
], Order.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING }),
    __metadata("design:type", String)
], Order.prototype, "deliveryStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "totalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "buyerNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "sellerNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "shippingAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "contactInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Order.prototype, "buyerConfirmed", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Order.prototype, "sellerConfirmed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "buyerConfirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "sellerConfirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "shippedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_card_entity_1.OrderCard, orderCard => orderCard.order, { cascade: true }),
    __metadata("design:type", Array)
], Order.prototype, "orderCards", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => conversation_entity_1.Conversation, conversation => conversation.order),
    __metadata("design:type", conversation_entity_1.Conversation)
], Order.prototype, "conversation", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "completedAt", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders')
], Order);
