// shipping.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingService } from './shipping.service';
import { ShippingController } from './controllers/shipping.controller';
import { CanadaPostModule } from './providers/canada-post/canada-post.module';
import { Shipment } from '../../common/entities/shipment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment]),
    CanadaPostModule,
  ],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}