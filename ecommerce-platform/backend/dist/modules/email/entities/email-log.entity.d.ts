export declare enum EmailStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    FAILED = "failed",
    BOUNCED = "bounced",
    DEFERRED = "deferred"
}
export declare class EmailLog {
    id: string;
    recipient: string;
    template: string | null;
    status: EmailStatus;
    errorMessage: string | null;
    messageId: string | null;
    requestId: string | null;
    metadata: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
    constructor(partial?: Partial<EmailLog>);
}
