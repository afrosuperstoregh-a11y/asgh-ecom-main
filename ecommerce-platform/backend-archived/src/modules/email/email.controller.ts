// backend/src/modules/email/email.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SendEmailResponseDto, EmailTemplateResponse } from './dto/email-response.dto';

@ApiTags('emails')
@Controller('emails')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send an email' })
  @ApiResponse({ status: 202, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<SendEmailResponseDto> {
    try {
      this.logger.log(`Sending email to: ${sendEmailDto.to}`);
      return await this.emailService.sendEmail(sendEmailDto);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  @Post('templates/:templateId/send')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send an email using a template' })
  @ApiResponse({ status: 202, description: 'Templated email sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async sendTemplateEmail(
    @Param('templateId') templateId: string,
    @Body() sendEmailDto: Omit<SendEmailDto, 'templateId'>,
  ): Promise<SendEmailResponseDto> {
    try {
      this.logger.log(`Sending template email (${templateId}) to: ${sendEmailDto.to}`);
      return await this.emailService.sendTemplateEmail(templateId, sendEmailDto);
    } catch (error) {
      this.logger.error(`Failed to send template email: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to send template email');
    }
  }

  @Get('templates/:templateId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get email template by ID' })
  @ApiResponse({ status: 200, description: 'Template found', type: EmailTemplateResponse })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(@Param('templateId') templateId: string): Promise<EmailTemplateResponse> {
    try {
      return await this.emailService.getTemplate(templateId);
    } catch (error) {
      this.logger.error(`Failed to get template: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get email template');
    }
  }

  @Get('validate-email')
  @ApiOperation({ summary: 'Validate an email address' })
  @ApiResponse({ status: 200, description: 'Email validation result' })
  async validateEmail(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    try {
      return await this.emailService.validateEmail(email);
    } catch (error) {
      this.logger.error(`Email validation failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Email validation failed');
    }
  }

  // Keep existing endpoints for backward compatibility
  @Post('test')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send a test email' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Test email sent successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async sendTestEmail(@Body() emailData: SendEmailDto) {
    return this.emailService.sendEmail({
      ...emailData,
      subject: emailData.subject || 'Test Email from E-Commerce Platform',
      text: emailData.text || 'This is a test email sent from the E-Commerce Platform.',
    });
  }

  @Post('order-confirmation')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Send order confirmation email' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Order confirmation email sent' })
  async sendOrderConfirmation(@Body() emailData: Omit<SendEmailDto, 'templateId'>) {
    return this.emailService.sendTemplateEmail('order-confirmation', {
      ...emailData,
      subject: emailData.subject || 'Your Order Confirmation',
    });
  }

  @Post('password-reset')
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Password reset email sent' })
  async sendPasswordReset(@Body() emailData: Omit<SendEmailDto, 'templateId'>) {
    return this.emailService.sendTemplateEmail('password-reset', {
      ...emailData,
      subject: emailData.subject || 'Password Reset Request',
    });
  }

  @Post('account-verification')
  @ApiOperation({ summary: 'Send account verification email' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Verification email sent' })
  async sendVerificationEmail(@Body() emailData: Omit<SendEmailDto, 'templateId'>) {
    return this.emailService.sendTemplateEmail('account-verification', {
      ...emailData,
      subject: emailData.subject || 'Verify Your Email Address',
    });
  }

  @Post('order-shipped')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Send order shipped notification' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Order shipped notification sent' })
  async sendOrderShipped(@Body() emailData: Omit<SendEmailDto, 'templateId'>) {
    return this.emailService.sendTemplateEmail('order-shipped', {
      ...emailData,
      subject: emailData.subject || 'Your Order Has Shipped',
    });
  }
}