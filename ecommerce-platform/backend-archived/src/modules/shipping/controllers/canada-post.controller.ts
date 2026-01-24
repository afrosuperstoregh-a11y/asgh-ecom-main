import { Controller, Post, Body, Get, Param, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CanadaPostService } from '../providers/canada-post/canada-post.service';
import { ShippingRateRequestDto } from '../dto/shipping-rate-request.dto';
import { ShippingRatesResponseDto } from '../dto/shipping-rate-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@ApiTags('Shipping')
@Controller('shipping/canada-post')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CanadaPostController {
  constructor(private readonly canadaPostService: CanadaPostService) {}

  @Post('rates')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get shipping rates' })
  @ApiResponse({
    status: 201,
    description: 'Returns available shipping rates',
    type: ShippingRatesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to get shipping rates',
  })
  async getRates(
    @Body() rateRequest: ShippingRateRequestDto,
  ): Promise<ShippingRatesResponseDto> {
    try {
      const rates = await this.canadaPostService.getRates({
        originPostalCode: rateRequest.originPostalCode,
        destinationPostalCode: rateRequest.destinationPostalCode,
        weight: rateRequest.weight,
        dimensions: rateRequest.dimensions,
      });

      // Mark the fastest and cheapest options
      if (rates.length > 0) {
        // Sort by price to find cheapest
        const sortedByPrice = [...rates].sort((a, b) => a.price - b.price);
        const cheapestRate = sortedByPrice[0];
        
        // Sort by delivery days to find fastest
        const sortedByDelivery = [...rates].sort(
          (a, b) => a.deliveryDays - b.deliveryDays || a.price - b.price
        );
        const fastestRate = sortedByDelivery[0];

        // Mark the options
        rates.forEach(rate => {
          rate.isCheapest = rate.serviceCode === cheapestRate.serviceCode;
          rate.isFastest = rate.serviceCode === fastestRate.serviceCode;
        });
      }

      return {
        rates,
        originPostalCode: rateRequest.originPostalCode,
        destinationPostalCode: rateRequest.destinationPostalCode,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get shipping rates',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('shipments')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new shipment' })
  @ApiResponse({
    status: 201,
    description: 'Shipment created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid shipment data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async createShipment() {
    // Implementation for creating a shipment will be added here
    throw new Error('Not implemented');
  }

  @Get('track/:trackingNumber')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Track a shipment' })
  @ApiResponse({
    status: 200,
    description: 'Returns tracking information',
  })
  @ApiResponse({
    status: 404,
    description: 'Tracking number not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async trackShipment(@Param('trackingNumber') trackingNumber: string) {
    try {
      const trackingInfo = await this.canadaPostService.trackShipment(trackingNumber);
      return trackingInfo;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Tracking information not found',
          error: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
