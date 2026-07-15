CREATE TABLE `customization` (
	`milkshake_id` integer NOT NULL,
	`ingredient_id` integer NOT NULL,
	`customization_qty` integer NOT NULL,
	PRIMARY KEY(`milkshake_id`, `ingredient_id`),
	FOREIGN KEY (`milkshake_id`) REFERENCES `milkshake`(`milkshake_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient`(`ingredient_id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "customization_qty_nonzero_check" CHECK("customization"."customization_qty" != 0)
);
--> statement-breakpoint
CREATE TABLE `ingredient` (
	`ingredient_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ingredient_name` text NOT NULL,
	`category` text NOT NULL,
	`qty_on_hand` integer NOT NULL,
	`price_per_serving` real NOT NULL,
	CONSTRAINT "ingredient_name_check" CHECK(length(trim("ingredient"."ingredient_name")) > 0),
	CONSTRAINT "ingredient_category_check" CHECK(length(trim("ingredient"."category")) > 0),
	CONSTRAINT "ingredient_qty_nonneg_check" CHECK("ingredient"."qty_on_hand" >= 0),
	CONSTRAINT "ingredient_price_scale_check" CHECK("ingredient"."price_per_serving" = ROUND("ingredient"."price_per_serving", 2)),
	CONSTRAINT "ingredient_price_nonneg_check" CHECK("ingredient"."price_per_serving" >= 0)
);
--> statement-breakpoint
CREATE TABLE `milkshake` (
	`milkshake_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`milkshake_subtotal` real NOT NULL,
	`txn` integer NOT NULL,
	`ingredient_id` integer NOT NULL,
	`recipe_id` integer NOT NULL,
	FOREIGN KEY (`txn`) REFERENCES `transaction`(`txn`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient`(`ingredient_id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`recipe_id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "milkshake_subtotal_scale_check" CHECK("milkshake"."milkshake_subtotal" = ROUND("milkshake"."milkshake_subtotal", 2)),
	CONSTRAINT "milkshake_subtotal_nonneg_check" CHECK("milkshake"."milkshake_subtotal" >= 0)
);
--> statement-breakpoint
CREATE TABLE `milkshake_recipe` (
	`milkshake_id` integer NOT NULL,
	`recipe_id` integer NOT NULL,
	`milkshake_size` text NOT NULL,
	PRIMARY KEY(`milkshake_id`, `recipe_id`),
	FOREIGN KEY (`milkshake_id`) REFERENCES `milkshake`(`milkshake_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`recipe_id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "milkshake_recipe_size_check" CHECK("milkshake_recipe"."milkshake_size" IN ('8oz', '12oz', '16oz'))
);
--> statement-breakpoint
CREATE TABLE `recipe` (
	`recipe_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_name` text NOT NULL,
	`base_price_8oz` real NOT NULL,
	`base_price_12oz` real NOT NULL,
	`base_price_16oz` real NOT NULL,
	`ingredient_id` integer NOT NULL,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient`(`ingredient_id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "recipe_name_check" CHECK(length(trim("recipe"."recipe_name")) > 0),
	CONSTRAINT "recipe_base_price_scale_check" CHECK("recipe"."base_price_8oz" = ROUND("recipe"."base_price_8oz", 2) AND "recipe"."base_price_12oz" = ROUND("recipe"."base_price_12oz", 2) AND "recipe"."base_price_16oz" = ROUND("recipe"."base_price_16oz", 2)),
	CONSTRAINT "recipe_base_price_nonneg_check" CHECK("recipe"."base_price_8oz" >= 0 AND "recipe"."base_price_12oz" >= 0 AND "recipe"."base_price_16oz" >= 0)
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredient` (
	`recipe_id` integer NOT NULL,
	`ingredient_id` integer NOT NULL,
	`needed_qty_8oz` integer NOT NULL,
	`needed_qty_12oz` integer NOT NULL,
	`needed_qty_16oz` integer NOT NULL,
	PRIMARY KEY(`recipe_id`, `ingredient_id`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipe`(`recipe_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient`(`ingredient_id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "recipe_ingredient_qty_positive_check" CHECK("recipe_ingredient"."needed_qty_8oz" > 0 AND "recipe_ingredient"."needed_qty_12oz" > 0 AND "recipe_ingredient"."needed_qty_16oz" > 0)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`schedule_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role` text NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`staff_id` integer NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "schedules_role_check" CHECK("schedules"."role" IN ('cashier', 'preparer', 'cleaning')),
	CONSTRAINT "schedules_date_check" CHECK("schedules"."end_date" >= "schedules"."start_date")
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`staff_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_name` text NOT NULL,
	CONSTRAINT "staff_name_check" CHECK(length(trim("staff"."staff_name")) > 0)
);
--> statement-breakpoint
CREATE TABLE `transaction` (
	`txn` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_name` text NOT NULL,
	`date` integer DEFAULT (unixepoch()) NOT NULL,
	`total_cost` real NOT NULL,
	`staff_id` integer NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "transaction_total_cost_scale_check" CHECK("transaction"."total_cost" = ROUND("transaction"."total_cost", 2)),
	CONSTRAINT "transaction_total_cost_nonneg_check" CHECK("transaction"."total_cost" >= 0),
	CONSTRAINT "customer_orders_name_check" CHECK(length(trim("transaction"."customer_name")) > 0)
);
