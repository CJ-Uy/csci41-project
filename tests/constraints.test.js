import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

const migrationPath = path.resolve('drizzle/0000_initial_schema.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8').replaceAll('--> statement-breakpoint', '');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'milkshake-db-'));
const testDbPath = path.join(tempDir, 'test.db');
const sqlite = new Database(testDbPath);
sqlite.pragma('foreign_keys = ON');
sqlite.exec(migrationSql);

function expectConstraint(name, statement, params = []) {
  assert.throws(() => sqlite.prepare(statement).run(...params), undefined, name);
  console.log(`PASS: ${name}`);
}

try {
  sqlite.prepare("INSERT INTO staff (name, email) VALUES ('Test Cashier', 'cashier@test.com')").run();
  sqlite.prepare("INSERT INTO ingredients (name, quantity, unit, add_on_price) VALUES ('Test Ingredient', 10, 'g', 100)").run();
  sqlite.prepare("INSERT INTO milkshake_recipes (name, base_price) VALUES ('Test Recipe', 10000)").run();
  sqlite.prepare("INSERT INTO customer_orders (customer_name, cashier_staff_id, status, total) VALUES ('Test Customer', 1, 'pending', 10000)").run();
  sqlite.prepare("INSERT INTO order_items (order_id, recipe_id, size, base_price, subtotal) VALUES (1, 1, '12oz', 10000, 10000)").run();

  expectConstraint(
    'invalid foreign key is rejected',
    "INSERT INTO schedules (staff_id, role, day, start_time, end_time) VALUES (999, 'cashier', 'Monday', '08:00', '16:00')",
  );
  expectConstraint(
    'negative recipe price is rejected',
    "INSERT INTO milkshake_recipes (name, base_price) VALUES ('Negative Price', -1)",
  );
  expectConstraint(
    'negative inventory is rejected',
    "INSERT INTO ingredients (name, quantity, unit, add_on_price) VALUES ('Negative Stock', -1, 'g', 0)",
  );
  expectConstraint(
    'invalid milkshake size is rejected',
    "INSERT INTO order_items (order_id, recipe_id, size, base_price, subtotal) VALUES (1, 1, '20oz', 10000, 10000)",
  );
  expectConstraint(
    'duplicate recipe name is rejected',
    "INSERT INTO milkshake_recipes (name, base_price) VALUES ('Test Recipe', 12000)",
  );
  expectConstraint(
    'schedule ending before start is rejected',
    "INSERT INTO schedules (staff_id, role, day, start_time, end_time) VALUES (1, 'cashier', 'Monday', '16:00', '08:00')",
  );
  expectConstraint(
    'invalid schedule role is rejected',
    "INSERT INTO schedules (staff_id, role, day, start_time, end_time) VALUES (1, 'manager', 'Monday', '08:00', '16:00')",
  );
  expectConstraint(
    'zero add-on quantity is rejected',
    'INSERT INTO order_item_add_ons (order_item_id, ingredient_id, quantity, unit_price, subtotal) VALUES (1, 1, 0, 100, 0)',
  );
  expectConstraint(
    'incorrect add-on subtotal is rejected',
    'INSERT INTO order_item_add_ons (order_item_id, ingredient_id, quantity, unit_price, subtotal) VALUES (1, 1, 2, 100, 100)',
  );

  console.log('All constraint tests passed.');
} finally {
  sqlite.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
}
