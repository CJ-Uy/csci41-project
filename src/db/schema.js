import { sql } from "drizzle-orm";
import {
	sqliteTable,
	integer,
	real,
	text,
	primaryKey,
	check,
} from "drizzle-orm/sqlite-core";

export const schedules = sqliteTable(
	"schedules",
	{
		id: integer("schedule_id").primaryKey({ autoIncrement: true }),
		role: text("role").notNull(),
		startDate: integer("start_date", { mode: "timestamp" }),
		endDate: integer("end_date", { mode: "timestamp" }),
		staffId: integer("staff_id")
			.notNull()
			.references(() => staff.id, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
	},
	(table) => [
		// Check if role is valid
		check(
			"schedules_role_check",
			sql`${table.role} IN ('cashier', 'preparer', 'cleaning')`,
		),
		// Check if start date is before end date
		check("schedules_date_check", sql`${table.endDate} >= ${table.startDate}`),
	],
);

export const staff = sqliteTable(
	"staff",
	{
		id: integer("staff_id").primaryKey({ autoIncrement: true }),
		name: text("staff_name").notNull(),
	},
	(table) => [
		// Check if staff name is not just empty spaces
		check("staff_name_check", sql`length(trim(${table.name})) > 0`),
	],
);

export const transaction = sqliteTable(
	"transaction",
	{
		id: integer("txn").primaryKey({ autoIncrement: true }),
		customerName: text("customer_name").notNull(),
		date: integer("date", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		totalCost: real("total_cost").notNull(),
		staffId: integer("staff_id")
			.notNull()
			.references(() => staff.id, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
	},
	(table) => [
		// Check if total_cost is 2 decimal places
		check(
			"transaction_total_cost_scale_check",
			sql`${table.totalCost} = ROUND(${table.totalCost}, 2)`,
		),
		// Check that total cost is not a negative number
		check("transaction_total_cost_nonneg_check", sql`${table.totalCost} >= 0`),
		// Check if customer name is not just empty spaces
		check(
			"customer_orders_name_check",
			sql`length(trim(${table.customerName})) > 0`,
		),
	],
);

export const milkshake = sqliteTable(
	"milkshake",
	{
		id: integer("milkshake_id").primaryKey({ autoIncrement: true }),
		subtotal: real("milkshake_subtotal").notNull(),
		txn: integer("txn")
			.notNull()
			.references(() => transaction.id, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
		ingredientId: integer("ingredient_id")
			.notNull()
			.references(() => ingredient.id, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
		recipeId: integer("recipe_id")
			.notNull()
			.references(() => recipe.id, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
	},
	(table) => [
		// Check if subtotal is 2 decimal places
		check(
			"milkshake_subtotal_scale_check",
			sql`${table.subtotal} = ROUND(${table.subtotal}, 2)`,
		),
		// Check that subtotal is not a negative number
		check("milkshake_subtotal_nonneg_check", sql`${table.subtotal} >= 0`),
	],
);

export const ingredient = sqliteTable(
	"ingredient",
	{
		id: integer("ingredient_id").primaryKey({ autoIncrement: true }),
		name: text("ingredient_name").notNull(),
		category: text("category").notNull(),
		qtyOnHand: integer("qty_on_hand").notNull(),
		pricePerServing: real("price_per_serving").notNull(),
	},
	(table) => [
		// Check if ingredient name is not just empty spaces
		check("ingredient_name_check", sql`length(trim(${table.name})) > 0`),
		// Check if category name is not just empty spaces
		check(
			"ingredient_category_check",
			sql`length(trim(${table.category})) > 0`,
		),
		// Check that stock on hand is not a negative number
		check("ingredient_qty_nonneg_check", sql`${table.qtyOnHand} >= 0`),
		// Check if price is 2 decimal places
		check(
			"ingredient_price_scale_check",
			sql`${table.pricePerServing} = ROUND(${table.pricePerServing}, 2)`,
		),
		// Check that price is not a negative number
		check("ingredient_price_nonneg_check", sql`${table.pricePerServing} >= 0`),
	],
);

export const recipe = sqliteTable(
	"recipe",
	{
		id: integer("recipe_id").primaryKey({ autoIncrement: true }),
		name: text("recipe_name").notNull(),
		basePrice8oz: real("base_price_8oz").notNull(),
		basePrice12oz: real("base_price_12oz").notNull(),
		basePrice16oz: real("base_price_16oz").notNull(),
		ingredientId: integer("ingredient_id")
			.notNull()
			.references(() => ingredient.id, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
	},
	(table) => [
		// Check if recipe name is not just empty spaces
		check("recipe_name_check", sql`length(trim(${table.name})) > 0`),
		// Check if base prices are 2 decimal places
		check(
			"recipe_base_price_scale_check",
			sql`${table.basePrice8oz} = ROUND(${table.basePrice8oz}, 2) AND ${table.basePrice12oz} = ROUND(${table.basePrice12oz}, 2) AND ${table.basePrice16oz} = ROUND(${table.basePrice16oz}, 2)`,
		),
		// Check that base prices are not negative numbers
		check(
			"recipe_base_price_nonneg_check",
			sql`${table.basePrice8oz} >= 0 AND ${table.basePrice12oz} >= 0 AND ${table.basePrice16oz} >= 0`,
		),
	],
);

export const customization = sqliteTable(
	"customization",
	{
		milkshakeId: integer("milkshake_id")
			.notNull()
			.references(() => milkshake.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		ingredientId: integer("ingredient_id")
			.notNull()
			.references(() => ingredient.id, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
		customizationQty: integer("customization_qty").notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.milkshakeId, table.ingredientId] }),
		// Negative qty allowed (removing a default ingredient); zero is meaningless
		check(
			"customization_qty_nonzero_check",
			sql`${table.customizationQty} != 0`,
		),
	],
);

export const milkshakeRecipe = sqliteTable(
	"milkshake_recipe",
	{
		milkshakeId: integer("milkshake_id")
			.notNull()
			.references(() => milkshake.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		recipeId: integer("recipe_id")
			.notNull()
			.references(() => recipe.id, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
		milkshakeSize: text("milkshake_size").notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.milkshakeId, table.recipeId] }),
		// Check if size is valid
		check(
			"milkshake_recipe_size_check",
			sql`${table.milkshakeSize} IN ('8oz', '12oz', '16oz')`,
		),
	],
);

export const recipeIngredient = sqliteTable(
	"recipe_ingredient",
	{
		recipeId: integer("recipe_id")
			.notNull()
			.references(() => recipe.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		ingredientId: integer("ingredient_id")
			.notNull()
			.references(() => ingredient.id, {
				onDelete: "restrict",
				onUpdate: "cascade",
			}),
		neededQty8oz: integer("needed_qty_8oz").notNull(),
		neededQty12oz: integer("needed_qty_12oz").notNull(),
		neededQty16oz: integer("needed_qty_16oz").notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.recipeId, table.ingredientId] }),
		// Check that needed quantities are positive numbers
		check(
			"recipe_ingredient_qty_positive_check",
			sql`${table.neededQty8oz} > 0 AND ${table.neededQty12oz} > 0 AND ${table.neededQty16oz} > 0`,
		),
	],
);
