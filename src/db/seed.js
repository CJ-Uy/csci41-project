import { db, sqlite } from './index.js';
import {
  staff,
  schedules,
  ingredients,
  milkshakeRecipes,
  recipeSizes,
  recipeIngredients,
  customerTransactions,
  transactionPreparers,
  milkshakes,
  milkshakeAddOns,
} from './schema.js';

function resetSequences() {
  sqlite
    .prepare(
      "DELETE FROM sqlite_sequence WHERE name IN ('staff','schedules','ingredients','milkshake_recipes','recipe_sizes','customer_transactions','milkshakes')",
    )
    .run();
}

const sizes = ['8oz', '12oz', '16oz'];

function seed() {
  const runSeed = sqlite.transaction(() => {
    db.delete(milkshakeAddOns).run();
    db.delete(transactionPreparers).run();
    db.delete(milkshakes).run();
    db.delete(customerTransactions).run();
    db.delete(recipeIngredients).run();
    db.delete(recipeSizes).run();
    db.delete(milkshakeRecipes).run();
    db.delete(ingredients).run();
    db.delete(schedules).run();
    db.delete(staff).run();
    resetSequences();

    db.insert(staff).values([
      { name: 'Maria Santos' },
      { name: 'Juan Dela Cruz' },
      { name: 'Rosa Garcia' },
      { name: 'Miguel Lopez' },
      { name: 'Ana Reyes' },
    ]).run();

    db.insert(schedules).values([
      { staffId: 1, role: 'cashier', startDate: '2026-07-13', endDate: '2026-07-19' },
      { staffId: 2, role: 'preparer', startDate: '2026-07-13', endDate: '2026-07-19' },
      { staffId: 3, role: 'cashier', startDate: '2026-07-13', endDate: '2026-07-19' },
      { staffId: 4, role: 'preparer', startDate: '2026-07-13', endDate: '2026-07-19' },
      { staffId: 5, role: 'cashier', startDate: '2026-07-13', endDate: '2026-07-19' },
    ]).run();

    db.insert(ingredients).values([
      { name: 'Milk', category: 'base', qtyOnHand: 10000, pricePerServing: 0 },
      { name: 'Vanilla Ice Cream', category: 'base', qtyOnHand: 5000, pricePerServing: 0 },
      { name: 'Chocolate Syrup', category: 'add-on', qtyOnHand: 3000, pricePerServing: 15 },
      { name: 'Strawberries', category: 'add-on', qtyOnHand: 2000, pricePerServing: 20 },
      { name: 'Mangoes', category: 'add-on', qtyOnHand: 3000, pricePerServing: 20 },
      { name: 'Oreos', category: 'add-on', qtyOnHand: 1500, pricePerServing: 20 },
      { name: 'Whipped Cream', category: 'add-on', qtyOnHand: 2000, pricePerServing: 15 },
      { name: 'Sprinkles', category: 'add-on', qtyOnHand: 1000, pricePerServing: 10 },
      { name: 'Caramel Sauce', category: 'add-on', qtyOnHand: 2500, pricePerServing: 20 },
      { name: 'Banana', category: 'add-on', qtyOnHand: 2500, pricePerServing: 15 },
    ]).run();

    db.insert(milkshakeRecipes).values([
      { name: 'Chocolate Milkshake' },
      { name: 'Strawberry Milkshake' },
      { name: 'Vanilla Milkshake' },
      { name: 'Oreo Milkshake' },
      { name: 'Mango Milkshake' },
    ]).run();

    const recipePrices = [120, 120, 100, 130, 130];
    db.insert(recipeSizes).values(
      recipePrices.flatMap((basePrice, recipeId) =>
        sizes.map((size, sizeIndex) => ({
          recipeId: recipeId + 1,
          size,
          basePrice: basePrice + sizeIndex * 20,
        })),
      ),
    ).run();

    const baseRequirements = [
      [1, 200, 2, 150, 3, 50],
      [1, 200, 2, 150, 4, 100],
      [1, 200, 2, 200],
      [1, 200, 2, 150, 6, 60],
      [1, 200, 2, 150, 5, 120],
    ];

    const requirements = [];

    baseRequirements.forEach((recipeRequirements, recipeIndex) => {
      for (const size of sizes) {
        for (let i = 0; i < recipeRequirements.length; i += 2) {
          requirements.push({
            recipeId: recipeIndex + 1,
            ingredientId: recipeRequirements[i],
            size,
            neededQty: recipeRequirements[i + 1],
          });
        }
      }
    });

    db.insert(recipeIngredients).values(requirements).run();

    db.insert(customerTransactions).values([
      { customerName: 'John Smith', cashierStaffId: 1 },
      { customerName: 'Bea Cruz', cashierStaffId: 1 },
      { customerName: 'Carlos Rodriguez', cashierStaffId: 3 },
      { customerName: 'Angela Davis', cashierStaffId: 3 },
      { customerName: 'Robert Brown', cashierStaffId: 5 },
    ]).run();

    db.insert(transactionPreparers).values([
      { transactionId: 1, staffId: 2 },
      { transactionId: 1, staffId: 4 },
      { transactionId: 2, staffId: 2 },
      { transactionId: 3, staffId: 4 },
      { transactionId: 4, staffId: 2 },
    ]).run();

    db.insert(milkshakes).values([
      { transactionId: 1, recipeId: 1, size: '12oz' },
      { transactionId: 1, recipeId: 2, size: '8oz' },
      { transactionId: 2, recipeId: 3, size: '16oz' },
      { transactionId: 2, recipeId: 4, size: '12oz' },
      { transactionId: 3, recipeId: 5, size: '12oz' },
      { transactionId: 3, recipeId: 5, size: '12oz' },
      { transactionId: 3, recipeId: 1, size: '16oz' },
      { transactionId: 4, recipeId: 3, size: '12oz' },
      { transactionId: 5, recipeId: 4, size: '16oz' },
      { transactionId: 5, recipeId: 2, size: '12oz' },
    ]).run();

    db.insert(milkshakeAddOns).values([
      { milkshakeId: 1, ingredientId: 7, quantity: 2 },
      { milkshakeId: 2, ingredientId: 8, quantity: 1 },
      { milkshakeId: 3, ingredientId: 7, quantity: 1 },
      { milkshakeId: 3, ingredientId: 8, quantity: 1 },
      { milkshakeId: 5, ingredientId: 7, quantity: 1 },
      { milkshakeId: 6, ingredientId: 8, quantity: 1 },
      { milkshakeId: 8, ingredientId: 9, quantity: 1 },
      { milkshakeId: 9, ingredientId: 7, quantity: 1 },
      { milkshakeId: 10, ingredientId: 8, quantity: 1 },
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
