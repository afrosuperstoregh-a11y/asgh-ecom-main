import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
export declare class EmailModule implements OnModuleInit {
    private readonly configService;
    private readonly emailService;
    constructor(configService: ConfigService, emailService: EmailService);
    onModuleInit(): Promise<void>;
}
