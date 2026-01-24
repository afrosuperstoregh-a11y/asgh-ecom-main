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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shipment_entity_1 = require("../../common/entities/shipment.entity");
const shipment_response_dto_1 = require("./dto/shipment-response.dto");
const canada_post_service_1 = require("./providers/canada-post/canada-post.service");
const class_transformer_1 = require("class-transformer");
let ShippingService = class ShippingService {
    constructor(shipmentRepository, canadaPostService) {
        this.shipmentRepository = shipmentRepository;
        this.canadaPostService = canadaPostService;
    }
    async create(createShipmentDto) {
        const shipment = this.shipmentRepository.create({
            orderId: createShipmentDto.orderId,
            carrier: 'CANADA_POST',
            serviceName: 'Regular',
            trackingNumber: `CP${Date.now()}`,
            cost: 0,
            status: shipment_entity_1.ShipmentStatus.CREATED,
        });
        const savedShipment = await this.shipmentRepository.save(shipment);
        return this.mapToDto(savedShipment);
    }
    async findAll() {
        const shipments = await this.shipmentRepository.find();
        return shipments.map(shipment => this.mapToDto(shipment));
    }
    async findOne(id) {
        const shipment = await this.shipmentRepository.findOne({ where: { id } });
        if (!shipment) {
            throw new common_1.NotFoundException(`Shipment with ID ${id} not found`);
        }
        return this.mapToDto(shipment);
    }
    async update(id, updateShipmentDto) {
        const shipment = await this.shipmentRepository.preload({
            id,
            ...updateShipmentDto,
        });
        if (!shipment) {
            throw new common_1.NotFoundException(`Shipment with ID ${id} not found`);
        }
        const updatedShipment = await this.shipmentRepository.save(shipment);
        return this.mapToDto(updatedShipment);
    }
    async remove(id) {
        const result = await this.shipmentRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Shipment with ID ${id} not found`);
        }
    }
    async getRates(rateRequest) {
        return this.canadaPostService.getRates(rateRequest);
    }
    async buyLabel(shipmentId) {
        const shipment = await this.shipmentRepository.findOne({ where: { id: shipmentId } });
        if (!shipment) {
            throw new common_1.NotFoundException(`Shipment with ID ${shipmentId} not found`);
        }
        const labelUrl = `https://api.shipping-provider.com/labels/${shipmentId}`;
        const trackingNumber = `CP${Date.now()}`;
        await this.shipmentRepository.update(shipmentId, {
            status: shipment_entity_1.ShipmentStatus.PROCESSING,
            trackingNumber,
            labelUrl,
        });
        return { labelUrl, trackingNumber };
    }
    mapToDto(shipment) {
        return (0, class_transformer_1.plainToInstance)(shipment_response_dto_1.ShipmentResponseDto, {
            id: shipment.id.toString(),
            orderId: shipment.orderId.toString(),
            carrier: shipment.carrier,
            serviceName: shipment.serviceName,
            trackingNumber: shipment.trackingNumber,
            labelUrl: shipment.labelUrl,
            cost: shipment.cost,
            status: shipment.status,
            sender: {},
            recipient: {},
            items: [],
            createdAt: shipment.createdAt?.toISOString(),
            updatedAt: shipment.updatedAt?.toISOString(),
        });
    }
};
exports.ShippingService = ShippingService;
exports.ShippingService = ShippingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shipment_entity_1.Shipment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        canada_post_service_1.CanadaPostService])
], ShippingService);
//# sourceMappingURL=shipping.service.js.map