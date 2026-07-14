import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  integer,
  real,
  text,
  primaryKey,
  foreignKey,
  check,
} from 'drizzle-orm/sqlite-core';

export const staff = sqliteTable('staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const schedules = sqliteTable(
  'schedules',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    staffId: integer('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    role: text('role').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
  },
  (table) => [
    check('schedules_role_check', sql`${table.role} IN ('cashier', 'preparer')`),
    check('schedules_date_check', sql`${table.endDate} >= ${table.startDate}`),
  ],
);

export const ingredients = sqliteTable(
  'ingredients',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    category: text('category').notNull(),
    qtyOnHand: integer('qty_on_hand').notNull().default(0),
    pricePerServing: real('price_per_serving').notNull().default(0),
  },
  (table) => [
    check('ingredients_qty_on_hand_check', sql`${table.qtyOnHand} >= 0`),
    check('ingredients_price_per_serving_check', sql`${table.pricePerServing} >= 0`),
  ],
);

export const milkshakeRecipes = sqliteTable('milkshake_recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const recipeSizes = sqliteTable(
  'recipe_sizes',
  {
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => milkshakeRecipes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    size: text('milkshake_size').notNull(),
    basePrice: real('base_price').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.size] }),
    check('recipe_sizes_size_check', sql`${table.size} IN ('8oz', '12oz', '16oz')`),
    check('recipe_sizes_base_price_check', sql`${table.basePrice} >= 0`),
  ],
);

export const recipeIngredients = sqliteTable(
  'recipe_ingredients',
  {
    recipeId: integer('recipe_id').notNull(),
    ingredientId: integer('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    size: text('milkshake_size').notNull(),
    neededQty: integer('needed_qty').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.ingredientId, table.size] }),
    foreignKey({
      columns: [table.recipeId, table.size],
      foreignColumns: [recipeSizes.recipeId, recipeSizes.size],
      name: 'recipe_ingredients_recipe_size_fk',
    }),
    check('recipe_ingredients_needed_qty_check', sql`${table.neededQty} >= 0`),
  ],
);

export const customerTransactions = sqliteTable(
  'customer_transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    customerName: text('customer_name').notNull(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    cashierStaffId: integer('cashier_staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  },
  (table) => [
    check('customer_transactions_name_check', sql`length(trim(${table.customerName})) > 0`),
  ],
);

export const transactionPreparers = sqliteTable(
  'transaction_preparers',
  {
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => customerTransactions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    staffId: integer('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.transactionId, table.staffId] })],
);

export const milkshakes = sqliteTable(
  'milkshakes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => customerTransactions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    recipeId: integer('recipe_id').notNull(),
    size: text('milkshake_size').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.recipeId, table.size],
      foreignColumns: [recipeSizes.recipeId, recipeSizes.size],
      name: 'milkshakes_recipe_size_fk',
    }),
  ],
);

export const milkshakeAddOns = sqliteTable(
  'milkshake_add_ons',
  {
    milkshakeId: integer('milkshake_id')
      .notNull()
      .references(() => milkshakes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ingredientId: integer('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    quantity: integer('customization_qty').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.milkshakeId, table.ingredientId] }),
    check('milkshake_add_ons_quantity_check', sql`${table.quantity} > 0`),
  ],
);
