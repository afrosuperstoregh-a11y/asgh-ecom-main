import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type WebhookEventStatus = 'pending' | 'processing' | 'processed' | 'failed';

@Entity('stripe_webhook_events')
@Index(['type', 'status']) // Add index for better query performance
@Index(['processedAt']) // Add index for cleanup operations
export class ProcessedWebhookEvent {
  @PrimaryColumn('varchar', { length: 255 })
  id!: string;

  @Column('varchar', { length: 100 })
  type!: string;

  @Column('jsonb', { nullable: true })
  data: any;

  @Column('varchar', { length: 20, default: 'pending' })
  status: WebhookEventStatus = 'pending';

  @Column('boolean', { default: false })
  processed: boolean = false;

  @Column('text', { nullable: true })
  error: string | null = null;

  @Column('timestamp with time zone', { nullable: true })
  processedAt: Date | null = null;

  @Column('int', { default: 0 })
  retryCount: number = 0;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null = null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  constructor(partial?: Partial<ProcessedWebhookEvent>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
