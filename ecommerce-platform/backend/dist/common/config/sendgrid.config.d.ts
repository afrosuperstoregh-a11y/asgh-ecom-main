declare const _default: (() => {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    sandboxMode: boolean;
    templateIds: {
        orderConfirmation: string;
        passwordReset: string;
        accountVerification: string;
        adminNotification: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    apiKey: string;
    fromEmail: string;
    fromName: string;
    sandboxMode: boolean;
    templateIds: {
        orderConfirmation: string;
        passwordReset: string;
        accountVerification: string;
        adminNotification: string;
    };
}>;
export default _default;
