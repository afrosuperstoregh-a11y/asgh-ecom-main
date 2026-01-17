// backend/src/migrations/1718414800000-CreateEmailLogsTable.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEmailLogsTable1718414800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'recipient',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'template',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'deferred'],
            default: "'pending'",
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'message_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'request_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add indexes
    await queryRunner.createIndex(
      'email_logs',
      new TableIndex({
        name: 'IDX_EMAIL_LOGS_RECIPIENT',
        columnNames: ['recipient'],
      }),
    );

    await queryRunner.createIndex(
      'email_logs',
      new TableIndex({
        name: 'IDX_EMAIL_LOGS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'email_logs',
      new TableIndex({
        name: 'IDX_EMAIL_LOGS_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('email_logs');
  }
}