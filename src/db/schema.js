import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  integer,
  real,
  text,
  primaryKey,
  check,
} from 'drizzle-orm/sqlite-core';

export const staff = sqliteTable('staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const schedules = sqliteTable(
  'schedules',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    staffId: integer('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    role: text('role').notNull(),
    day: text('day').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
  },
  (table) => [
    check('schedules_role_check', sql`${table.role} IN ('cashier', 'preparer')`),
    check('schedules_time_check', sql`${table.endTime} > ${table.startTime}`),
  ],
);

export const ingredients = sqliteTable(
  'ingredients',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    quantity: integer('quantity').notNull().default(0),
    unit: text('unit').notNull().default('g'),
    addOnPrice: real('add_on_price').notNull().default(0),
  },
  (table) => [
    check('ingredients_quantity_check', sql`${table.quantity} >= 0`),
    check('ingredients_add_on_price_check', sql`${table.addOnPrice} >= 0`),
  ],
);

export const milkshakeRecipes = sqliteTable(
  'milkshake_recipes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    basePrice: real('base_price').notNull(),
    description: text('description'),
  },
  (table) => [
    check('milkshake_recipes_base_price_check', sql`${table.basePrice} >= 0`),
  ],
);

export const recipeIngredients = sqliteTable(
  'recipe_ingredients',
  {
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => milkshakeRecipes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ingredientId: integer('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    quantity: integer('quantity').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.ingredientId] }),
    check('recipe_ingredients_quantity_check', sql`${table.quantity} > 0`),
  ],
);

export const customerOrders = sqliteTable(
  'customer_orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    customerName: text('customer_name').notNull(),
    cashierStaffId: integer('cashier_staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    status: text('status').notNull().default('pending'),
    total: real('total').notNull().default(0),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check('customer_orders_name_check', sql`length(trim(${table.customerName})) > 0`),
    check(
      'customer_orders_status_check',
      sql`${table.status} IN ('pending', 'preparing', 'completed', 'cancelled')`,
    ),
    check('customer_orders_total_check', sql`${table.total} >= 0`),
  ],
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id')
      .notNull()
      .references(() => customerOrders.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => milkshakeRecipes.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    size: text('size').notNull(),
    basePrice: real('base_price').notNull(),
    subtotal: real('subtotal').notNull(),
  },
  (table) => [
    check('order_items_size_check', sql`${table.size} IN ('8oz', '12oz', '16oz')`),
    check('order_items_base_price_check', sql`${table.basePrice} >= 0`),
    check('order_items_subtotal_check', sql`${table.subtotal} >= 0`),
  ],
);

export const orderItemAddOns = sqliteTable(
  'order_item_add_ons',
  {
    orderItemId: integer('order_item_id')
      .notNull()
      .references(() => orderItems.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ingredientId: integer('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    quantity: integer('quantity').notNull(),
    unitPrice: real('unit_price').notNull(),
    subtotal: real('subtotal').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.orderItemId, table.ingredientId] }),
    check('order_item_add_ons_quantity_check', sql`${table.quantity} != 0`),
    check('order_item_add_ons_unit_price_check', sql`${table.unitPrice} >= 0`),
    check(
      'order_item_add_ons_math_check',
      sql`${table.subtotal} = ${table.quantity} * ${table.unitPrice}`,
    ),
  ],
);
