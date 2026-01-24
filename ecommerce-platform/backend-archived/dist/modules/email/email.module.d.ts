import { DynamicModule } from '@nestjs/common';
export interface EmailModuleOptions {
    isGlobal?: boolean;
    useMock?: boolean;
}
export declare class EmailModule {
    static forRoot(options?: EmailModuleOptions): DynamicModule;
}
