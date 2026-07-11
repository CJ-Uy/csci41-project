import { db, sqlite } from './index.js';
import {
  staff,
  schedules,
  ingredients,
  milkshakeRecipes,
  recipeIngredients,
  customerOrders,
  orderItems,
  orderItemAddOns,
} from './schema.js';

function resetSequences() {
  sqlite.prepare("DELETE FROM sqlite_sequence WHERE name IN ('staff','schedules','ingredients','milkshake_recipes','customer_orders','order_items')").run();
}

function seed() {
  const runSeed = sqlite.transaction(() => {
    db.delete(orderItemAddOns).run();
    db.delete(orderItems).run();
    db.delete(customerOrders).run();
    db.delete(recipeIngredients).run();
    db.delete(milkshakeRecipes).run();
    db.delete(ingredients).run();
    db.delete(schedules).run();
    db.delete(staff).run();
    resetSequences();

    db.insert(staff).values([
      { name: 'Maria Santos', email: 'maria@milkshake.com', phone: '09170000001' },
      { name: 'Juan Dela Cruz', email: 'juan@milkshake.com', phone: '09170000002' },
      { name: 'Rosa Garcia', email: 'rosa@milkshake.com', phone: '09170000003' },
      { name: 'Miguel Lopez', email: 'miguel@milkshake.com', phone: '09170000004' },
      { name: 'Ana Reyes', email: 'ana@milkshake.com', phone: '09170000005' },
    ]).run();

    db.insert(schedules).values([
      { staffId: 1, role: 'cashier', day: 'Monday', startTime: '08:00', endTime: '16:00' },
      { staffId: 2, role: 'preparer', day: 'Monday', startTime: '08:00', endTime: '16:00' },
      { staffId: 3, role: 'cashier', day: 'Monday', startTime: '16:00', endTime: '23:00' },
      { staffId: 4, role: 'preparer', day: 'Monday', startTime: '16:00', endTime: '23:00' },
      { staffId: 5, role: 'cashier', day: 'Tuesday', startTime: '10:00', endTime: '18:00' },
    ]).run();

    db.insert(ingredients).values([
      { name: 'Milk', quantity: 10000, unit: 'ml', addOnPrice: 0 },
      { name: 'Vanilla Ice Cream', quantity: 5000, unit: 'g', addOnPrice: 0 },
      { name: 'Chocolate Syrup', quantity: 3000, unit: 'ml', addOnPrice: 15.00 },
      { name: 'Strawberries', quantity: 2000, unit: 'g', addOnPrice: 20.00 },
      { name: 'Mangoes', quantity: 3000, unit: 'g', addOnPrice: 20.00 },
      { name: 'Oreos', quantity: 1500, unit: 'g', addOnPrice: 20.00 },
      { name: 'Whipped Cream', quantity: 2000, unit: 'g', addOnPrice: 15.00 },
      { name: 'Sprinkles', quantity: 1000, unit: 'g', addOnPrice: 10.00 },
      { name: 'Caramel Sauce', quantity: 2500, unit: 'ml', addOnPrice: 20.00 },
      { name: 'Banana', quantity: 2500, unit: 'g', addOnPrice: 15.00 },
    ]).run();

    db.insert(milkshakeRecipes).values([
      { name: 'Chocolate Milkshake', basePrice: 120.00, description: 'Rich chocolate flavor' },
      { name: 'Strawberry Milkshake', basePrice: 120.00, description: 'Fresh strawberry taste' },
      { name: 'Vanilla Milkshake', basePrice: 100.00, description: 'Classic vanilla' },
      { name: 'Oreo Milkshake', basePrice: 130.00, description: 'Cookies and cream' },
      { name: 'Mango Milkshake', basePrice: 130.00, description: 'Tropical mango' },
    ]).run();

    db.insert(recipeIngredients).values([
      { recipeId: 1, ingredientId: 1, quantity: 200 },
      { recipeId: 1, ingredientId: 2, quantity: 150 },
      { recipeId: 1, ingredientId: 3, quantity: 50 },
      { recipeId: 2, ingredientId: 1, quantity: 200 },
      { recipeId: 2, ingredientId: 2, quantity: 150 },
      { recipeId: 2, ingredientId: 4, quantity: 100 },
      { recipeId: 3, ingredientId: 1, quantity: 200 },
      { recipeId: 3, ingredientId: 2, quantity: 200 },
      { recipeId: 4, ingredientId: 1, quantity: 200 },
      { recipeId: 4, ingredientId: 2, quantity: 150 },
      { recipeId: 4, ingredientId: 6, quantity: 60 },
      { recipeId: 5, ingredientId: 1, quantity: 200 },
      { recipeId: 5, ingredientId: 2, quantity: 150 },
      { recipeId: 5, ingredientId: 5, quantity: 120 },
    ]).run();

    db.insert(customerOrders).values([
      { customerName: 'John Smith', cashierStaffId: 1, status: 'completed', total: 280.00 },
      { customerName: 'Bea Cruz', cashierStaffId: 1, status: 'completed', total: 255.00 },
      { customerName: 'Carlos Rodriguez', cashierStaffId: 3, status: 'completed', total: 405.00 },
      { customerName: 'Angela Davis', cashierStaffId: 3, status: 'pending', total: 120.00 },
      { customerName: 'Robert Brown', cashierStaffId: 5, status: 'preparing', total: 275.00 },
    ]).run();

    db.insert(orderItems).values([
      { orderId: 1, recipeId: 1, size: '12oz', basePrice: 120.00, subtotal: 150.00 },
      { orderId: 1, recipeId: 2, size: '8oz', basePrice: 120.00, subtotal: 130.00 },
      { orderId: 2, recipeId: 3, size: '16oz', basePrice: 100.00, subtotal: 125.00 },
      { orderId: 2, recipeId: 4, size: '12oz', basePrice: 130.00, subtotal: 130.00 },
      { orderId: 3, recipeId: 5, size: '12oz', basePrice: 130.00, subtotal: 145.00 },
      { orderId: 3, recipeId: 5, size: '12oz', basePrice: 130.00, subtotal: 140.00 },
      { orderId: 3, recipeId: 1, size: '16oz', basePrice: 120.00, subtotal: 120.00 },
      { orderId: 4, recipeId: 3, size: '12oz', basePrice: 100.00, subtotal: 120.00 },
      { orderId: 5, recipeId: 4, size: '16oz', basePrice: 130.00, subtotal: 145.00 },
      { orderId: 5, recipeId: 2, size: '12oz', basePrice: 120.00, subtotal: 130.00 },
    ]).run();

    db.insert(orderItemAddOns).values([
      { orderItemId: 1, ingredientId: 7, quantity: 2, unitPrice: 15.00, subtotal: 30.00 },
      { orderItemId: 2, ingredientId: 8, quantity: 1, unitPrice: 10.00, subtotal: 10.00 },
      { orderItemId: 3, ingredientId: 7, quantity: 1, unitPrice: 15.00, subtotal: 15.00 },
      { orderItemId: 3, ingredientId: 8, quantity: 1, unitPrice: 10.00, subtotal: 10.00 },
      { orderItemId: 5, ingredientId: 7, quantity: 1, unitPrice: 15.00, subtotal: 15.00 },
      { orderItemId: 6, ingredientId: 8, quantity: 1, unitPrice: 10.00, subtotal: 10.00 },
      { orderItemId: 8, ingredientId: 9, quantity: 1, unitPrice: 20.00, subtotal: 20.00 },
      { orderItemId: 9, ingredientId: 7, quantity: 1, unitPrice: 15.00, subtotal: 15.00 },
      { orderItemId: 10, ingredientId: 8, quantity: 1, unitPrice: 10.00, subtotal: 10.00 },
    ]).run();
  });

  try {
    runSeed();
    console.log('Database seed completed successfully.');
  } catch (error) {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  } finally {
    sqlite.close();
  }
}

seed();
