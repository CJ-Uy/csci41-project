import { db, sqlite } from "./index.js";
import {
	staff,
	schedules,
	ingredient,
	recipe,
	recipeIngredient,
	transaction,
	milkshake,
	milkshakeRecipe,
	customization,
} from "./schema.js";

function resetSequences() {
	sqlite
		.prepare(
			"DELETE FROM sqlite_sequence WHERE name IN ('staff','schedules','ingredient','recipe','milkshake','transaction')",
		)
		.run();
}

const sizes = ["8oz", "12oz", "16oz"];

const ingredientRows = [
	{ name: "Milk", category: "milk", qtyOnHand: 10000, pricePerServing: 0 },
	{
		name: "Vanilla Ice Cream",
		category: "base",
		qtyOnHand: 5000,
		pricePerServing: 0,
	},
	{
		name: "Chocolate Syrup",
		category: "topping",
		qtyOnHand: 3000,
		pricePerServing: 15,
	},
	{
		name: "Strawberries",
		category: "fruits",
		qtyOnHand: 2000,
		pricePerServing: 20,
	},
	{ name: "Mangoes", category: "fruits", qtyOnHand: 3000, pricePerServing: 20 },
	{ name: "Oreos", category: "mix-in", qtyOnHand: 1500, pricePerServing: 20 },
	{
		name: "Whipped Cream",
		category: "topping",
		qtyOnHand: 2000,
		pricePerServing: 15,
	},
	{
		name: "Sprinkles",
		category: "mix-in",
		qtyOnHand: 1000,
		pricePerServing: 10,
	},
	{
		name: "Caramel Sauce",
		category: "topping",
		qtyOnHand: 2500,
		pricePerServing: 20,
	},
	{ name: "Banana", category: "fruits", qtyOnHand: 2500, pricePerServing: 15 },
];

// base_price_8oz, then +20 per size step; ingredientId = the recipe's signature ingredient
const recipeRows = [
	{ name: "Chocolate Milkshake", price8oz: 120, ingredientId: 3 },
	{ name: "Strawberry Milkshake", price8oz: 120, ingredientId: 4 },
	{ name: "Vanilla Milkshake", price8oz: 100, ingredientId: 2 },
	{ name: "Oreo Milkshake", price8oz: 130, ingredientId: 6 },
	{ name: "Mango Milkshake", price8oz: 130, ingredientId: 5 },
];

// [ingredientId, qtyFor8oz] pairs per recipe; 12oz = 1.5x, 16oz = 2x
const recipeRequirements = [
	[
		[1, 200],
		[2, 150],
		[3, 50],
	],
	[
		[1, 200],
		[2, 150],
		[4, 100],
	],
	[
		[1, 200],
		[2, 200],
	],
	[
		[1, 200],
		[2, 150],
		[6, 60],
	],
	[
		[1, 200],
		[2, 150],
		[5, 120],
	],
];

// customizations: [ingredientId, qty] pairs
const orders = [
	{
		customerName: "John Smith",
		staffId: 1,
		shakes: [
			{ recipeId: 1, size: "12oz", customizations: [[7, 2]] },
			{ recipeId: 2, size: "8oz", customizations: [[8, 1]] },
		],
	},
	{
		customerName: "Bea Cruz",
		staffId: 1,
		shakes: [
			{
				recipeId: 3,
				size: "16oz",
				customizations: [
					[7, 1],
					[8, 1],
				],
			},
			{ recipeId: 4, size: "12oz", customizations: [] },
		],
	},
	{
		customerName: "Carlos Rodriguez",
		staffId: 3,
		shakes: [
			{ recipeId: 5, size: "12oz", customizations: [[7, 1]] },
			{ recipeId: 5, size: "12oz", customizations: [[8, 1]] },
			{ recipeId: 1, size: "16oz", customizations: [] },
		],
	},
	{
		customerName: "Angela Davis",
		staffId: 3,
		shakes: [{ recipeId: 3, size: "12oz", customizations: [[9, 1]] }],
	},
	{
		customerName: "Robert Brown",
		staffId: 5,
		shakes: [
			{ recipeId: 4, size: "16oz", customizations: [[7, 1]] },
			{ recipeId: 2, size: "12oz", customizations: [[8, 1]] },
		],
	},
];

function basePriceFor(recipeId, size) {
	return recipeRows[recipeId - 1].price8oz + sizes.indexOf(size) * 20;
}

function shakeSubtotal(shake) {
	const customizationTotal = shake.customizations.reduce(
		(sum, [ingredientId, qty]) =>
			sum + ingredientRows[ingredientId - 1].pricePerServing * qty,
		0,
	);
	return basePriceFor(shake.recipeId, shake.size) + customizationTotal;
}

function seed() {
	const runSeed = sqlite.transaction(() => {
		db.delete(customization).run();
		db.delete(milkshakeRecipe).run();
		db.delete(milkshake).run();
		db.delete(transaction).run();
		db.delete(recipeIngredient).run();
		db.delete(recipe).run();
		db.delete(ingredient).run();
		db.delete(schedules).run();
		db.delete(staff).run();
		resetSequences();

		db.insert(staff)
			.values([
				{ name: "Maria Santos" },
				{ name: "Juan Dela Cruz" },
				{ name: "Rosa Garcia" },
				{ name: "Miguel Lopez" },
				{ name: "Ana Reyes" },
			])
			.run();

		const weekStart = new Date("2026-07-13");
		const weekEnd = new Date("2026-07-19");
		db.insert(schedules)
			.values([
				{ staffId: 1, role: "cashier", startDate: weekStart, endDate: weekEnd },
				{
					staffId: 2,
					role: "preparer",
					startDate: weekStart,
					endDate: weekEnd,
				},
				{ staffId: 3, role: "cashier", startDate: weekStart, endDate: weekEnd },
				{
					staffId: 4,
					role: "preparer",
					startDate: weekStart,
					endDate: weekEnd,
				},
				{ staffId: 5, role: "cashier", startDate: weekStart, endDate: weekEnd },
			])
			.run();

		db.insert(ingredient).values(ingredientRows).run();

		db.insert(recipe)
			.values(
				recipeRows.map((r) => ({
					name: r.name,
					basePrice8oz: r.price8oz,
					basePrice12oz: r.price8oz + 20,
					basePrice16oz: r.price8oz + 40,
					ingredientId: r.ingredientId,
				})),
			)
			.run();

		db.insert(recipeIngredient)
			.values(
				recipeRequirements.flatMap((pairs, recipeIndex) =>
					pairs.map(([ingredientId, qty]) => ({
						recipeId: recipeIndex + 1,
						ingredientId,
						neededQty8oz: qty,
						neededQty12oz: qty * 1.5,
						neededQty16oz: qty * 2,
					})),
				),
			)
			.run();

		db.insert(transaction)
			.values(
				orders.map((order) => ({
					customerName: order.customerName,
					staffId: order.staffId,
					totalCost: order.shakes.reduce(
						(sum, shake) => sum + shakeSubtotal(shake),
						0,
					),
				})),
			)
			.run();

		let milkshakeId = 0;
		orders.forEach((order, orderIndex) => {
			for (const shake of order.shakes) {
				milkshakeId += 1;
				db.insert(milkshake)
					.values({
						subtotal: shakeSubtotal(shake),
						txn: orderIndex + 1,
						ingredientId: recipeRows[shake.recipeId - 1].ingredientId,
						recipeId: shake.recipeId,
					})
					.run();

				db.insert(milkshakeRecipe)
					.values({
						milkshakeId,
						recipeId: shake.recipeId,
						milkshakeSize: shake.size,
					})
					.run();

				for (const [ingredientId, qty] of shake.customizations) {
					db.insert(customization)
						.values({
							milkshakeId,
							ingredientId,
							customizationQty: qty,
						})
						.run();
				}
			}
		});
	});

	try {
		runSeed();
		console.log("Database seed completed successfully.");
	} catch (error) {
		console.error("Database seed failed:", error);
		process.exitCode = 1;
	} finally {
		sqlite.close();
	}
}

seed();
