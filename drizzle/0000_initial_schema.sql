CREATE TABLE `staff` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `email` text,
  `phone` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT `staff_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `staff_id` integer NOT NULL,
  `role` text NOT NULL,
  `day` text NOT NULL,
  `start_time` text NOT NULL,
  `end_time` text NOT NULL,
  FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE cascade ON DELETE restrict,
  CONSTRAINT `schedules_role_check` CHECK(`role` IN ('cashier', 'preparer')),
  CONSTRAINT `schedules_time_check` CHECK(`end_time` > `start_time`)
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `quantity` integer DEFAULT 0 NOT NULL,
  `unit` text DEFAULT 'g' NOT NULL,
  `add_on_price` real DEFAULT 0 NOT NULL,
  CONSTRAINT `ingredients_name_unique` UNIQUE(`name`),
  CONSTRAINT `ingredients_quantity_check` CHECK(`quantity` >= 0),
  CONSTRAINT `ingredients_add_on_price_check` CHECK(`add_on_price` >= 0)
);
--> statement-breakpoint
CREATE TABLE `milkshake_recipes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `base_price` real NOT NULL,
  `description` text,
  CONSTRAINT `milkshake_recipes_name_unique` UNIQUE(`name`),
  CONSTRAINT `milkshake_recipes_base_price_check` CHECK(`base_price` >= 0)
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
  `recipe_id` integer NOT NULL,
  `ingredient_id` integer NOT NULL,
  `quantity` integer NOT NULL,
  PRIMARY KEY(`recipe_id`, `ingredient_id`),
  FOREIGN KEY (`recipe_id`) REFERENCES `milkshake_recipes`(`id`) ON UPDATE cascade ON DELETE cascade,
  FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE cascade ON DELETE restrict,
  CONSTRAINT `recipe_ingredients_quantity_check` CHECK(`quantity` > 0)
);
--> statement-breakpoint
CREATE TABLE `customer_orders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `customer_name` text NOT NULL,
  `cashier_staff_id` integer NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `total` real DEFAULT 0 NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`cashier_staff_id`) REFERENCES `staff`(`id`) ON UPDATE cascade ON DELETE restrict,
  CONSTRAINT `customer_orders_name_check` CHECK(length(trim(`customer_name`)) > 0),
  CONSTRAINT `customer_orders_status_check` CHECK(`status` IN ('pending', 'preparing', 'completed', 'cancelled')),
  CONSTRAINT `customer_orders_total_check` CHECK(`total` >= 0)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `recipe_id` integer NOT NULL,
  `size` text NOT NULL,
  `base_price` real NOT NULL,
  `subtotal` real NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `customer_orders`(`id`) ON UPDATE cascade ON DELETE cascade,
  FOREIGN KEY (`recipe_id`) REFERENCES `milkshake_recipes`(`id`) ON UPDATE cascade ON DELETE restrict,
  CONSTRAINT `order_items_size_check` CHECK(`size` IN ('8oz', '12oz', '16oz')),
  CONSTRAINT `order_items_base_price_check` CHECK(`base_price` >= 0),
  CONSTRAINT `order_items_subtotal_check` CHECK(`subtotal` >= 0)
);
--> statement-breakpoint
CREATE TABLE `order_item_add_ons` (
  `order_item_id` integer NOT NULL,
  `ingredient_id` integer NOT NULL,
  `quantity` integer NOT NULL,
  `unit_price` real NOT NULL,
  `subtotal` real NOT NULL,
  PRIMARY KEY(`order_item_id`, `ingredient_id`),
  FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE cascade ON DELETE cascade,
  FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE cascade ON DELETE restrict,
  CONSTRAINT `order_item_add_ons_quantity_check` CHECK(`quantity` > 0),
  CONSTRAINT `order_item_add_ons_unit_price_check` CHECK(`unit_price` >= 0),
  CONSTRAINT `order_item_add_ons_subtotal_check` CHECK(`subtotal` >= 0),
  CONSTRAINT `order_item_add_ons_math_check` CHECK(`subtotal` = `quantity` * `unit_price`)
);
