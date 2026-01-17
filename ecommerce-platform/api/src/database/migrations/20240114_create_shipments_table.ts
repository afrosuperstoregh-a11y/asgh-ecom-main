import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('shipments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    
    // Carrier information
    table.string('carrier').notNullable().defaultTo('CANADA_POST');
    table.string('service_name').notNullable();
    
    // Tracking and shipping details
    table.string('tracking_number').notNullable().unique();
    table.string('tracking_url');
    table.string('label_url');
    
    // Financial details
    table.decimal('shipping_cost', 10, 2).notNullable();
    table.decimal('insurance_cost', 10, 2).defaultTo(0);
    table.decimal('total_cost', 10, 2).notNullable();
    
    // Package details
    table.jsonb('dimensions').notNullable(); // { length, width, height, weight, unit }
    
    // Address information
    table.jsonb('origin_address').notNullable();
    table.jsonb('destination_address').notNullable();
    
    // Status and timestamps
    table.string('status').notNullable().defaultTo('created');
    table.timestamp('shipped_at').nullable();
    table.timestamp('delivered_at').nullable();
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes
    table.index(['order_id']);
    table.index(['tracking_number']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('shipments');
}
