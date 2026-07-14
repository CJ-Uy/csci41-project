CREATE TABLE `customer_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`cashier_staff_id` integer NOT NULL,
	FOREIGN KEY (`cashier_staff_id`) REFERENCES `staff`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "customer_orders_name_check" CHECK(length(trim("customer_orders"."customer_name")) > 0)
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`qty_on_hand` integer DEFAULT 0 NOT NULL,
	`price_per_serving` real DEFAULT 0 NOT NULL,
	CONSTRAINT "ingredients_qty_on_hand_check" CHECK("ingredients"."qty_on_hand" >= 0),
	CONSTRAINT "ingredients_price_per_serving_check" CHECK("ingredients"."price_per_serving" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ingredients_name_unique` ON `ingredients` (`name`);--> statement-breakpoint
CREATE TABLE `milkshake_recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `milkshake_recipes_name_unique` ON `milkshake_recipes` (`name`);--> statement-breakpoint
CREATE TABLE `order_item_add_ons` (
	`order_item_id` integer NOT NULL,
	`ingredient_id` integer NOT NULL,
	`customization_qty` integer NOT NULL,
	PRIMARY KEY(`order_item_id`, `ingredient_id`),
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "order_item_add_ons_quantity_check" CHECK("order_item_add_ons"."customization_qty" > 0)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`recipe_id` integer NOT NULL,
	`milkshake_size` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `customer_orders`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`recipe_id`,`milkshake_size`) REFERENCES `recipe_sizes`(`recipe_id`,`milkshake_size`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredient_requirements` (
	`recipe_id` integer NOT NULL,
	`ingredient_id` integer NOT NULL,
	`milkshake_size` text NOT NULL,
	`needed_qty` integer NOT NULL,
	PRIMARY KEY(`recipe_id`, `ingredient_id`, `milkshake_size`),
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`recipe_id`,`milkshake_size`) REFERENCES `recipe_sizes`(`recipe_id`,`milkshake_size`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "recipe_requirements_needed_qty_check" CHECK("recipe_ingredient_requirements"."needed_qty" >= 0)
);
--> statement-breakpoint
CREATE TABLE `recipe_sizes` (
	`recipe_id` integer NOT NULL,
	`milkshake_size` text NOT NULL,
	`base_price` real NOT NULL,
	PRIMARY KEY(`recipe_id`, `milkshake_size`),
	FOREIGN KEY (`recipe_id`) REFERENCES `milkshake_recipes`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "recipe_sizes_size_check" CHECK("recipe_sizes"."milkshake_size" IN ('8oz', '12oz', '16oz')),
	CONSTRAINT "recipe_sizes_base_price_check" CHECK("recipe_sizes"."base_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_id` integer NOT NULL,
	`role` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "schedules_role_check" CHECK("schedules"."role" IN ('cashier', 'preparer')),
	CONSTRAINT "schedules_date_check" CHECK("schedules"."end_date" >= "schedules"."start_date")
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_preparers` (
	`transaction_id` integer NOT NULL,
	`staff_id` integer NOT NULL,
	PRIMARY KEY(`transaction_id`, `staff_id`),
	FOREIGN KEY (`transaction_id`) REFERENCES `customer_orders`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE cascade ON DELETE restrict
);
