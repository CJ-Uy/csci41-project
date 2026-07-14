import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	customerTransactions,
	ingredients,
	milkshakeRecipes,
	recipeSizes,
	milkshakeAddOns,
	milkshakes,
	staff,
} from "../db/schema.js";

const validSizes = ["8oz", "12oz", "16oz"];

export function createOrder(orderData) {
	const { customerName, cashierStaffId, items } = orderData;

	if (
		!customerName?.trim() ||
		!Number.isInteger(cashierStaffId) ||
		cashierStaffId <= 0 ||
		!Array.isArray(items) ||
		items.length === 0
	) {
		throw new Error(
			"Please provide a customer, cashier, and at least one milkshake.",
		);
	}

	return db.transaction((tx) => {
		const cashier = tx
			.select()
			.from(staff)
			.where(eq(staff.id, cashierStaffId))
			.get();

		if (!cashier) {
			throw new Error("Selected cashier does not exist.");
		}

		const savedOrder = tx
			.insert(customerTransactions)
			.values({ customerName: customerName.trim(), cashierStaffId })
			.returning({ transactionId: customerTransactions.id })
			.get();

		let total = 0;

		for (const item of items) {
			if (!validSizes.includes(item.size)) {
				throw new Error("Milkshake size must be 8oz, 12oz, or 16oz.");
			}

			const recipe = item.recipeId
				? tx
						.select()
						.from(milkshakeRecipes)
						.where(eq(milkshakeRecipes.id, item.recipeId))
						.get()
				: tx
						.select()
						.from(milkshakeRecipes)
						.where(eq(milkshakeRecipes.name, item.recipeName))
						.get();

			if (!recipe) {
				throw new Error("Selected milkshake recipe does not exist.");
			}

			const recipeSize = tx
				.select()
				.from(recipeSizes)
				.where(
					and(
						eq(recipeSizes.recipeId, recipe.id),
						eq(recipeSizes.size, item.size),
					),
				)
				.get();

			if (!recipeSize) {
				throw new Error("Selected recipe size does not exist.");
			}

			const addOns = item.addOns || [];
			let addOnTotal = 0;
			const savedAddOns = [];

			for (const addOn of addOns) {
				if (!Number.isInteger(addOn.quantity) || addOn.quantity <= 0) {
					throw new Error("Add-on quantity must be a positive integer.");
				}

				const ingredient = addOn.ingredientId
					? tx
							.select()
							.from(ingredients)
							.where(eq(ingredients.id, addOn.ingredientId))
							.get()
					: tx
							.select()
							.from(ingredients)
							.where(eq(ingredients.name, addOn.ingredientName))
							.get();

				if (!ingredient) {
					throw new Error("Selected add-on does not exist.");
				}

				if (
					ingredient.category !== "add-on" ||
					ingredient.pricePerServing <= 0
				) {
					throw new Error("Selected ingredient is not an available add-on.");
				}

				const subtotal = ingredient.pricePerServing * addOn.quantity;
				addOnTotal += subtotal;
				savedAddOns.push({ ingredient, quantity: addOn.quantity });
			}

			const subtotal = recipeSize.basePrice + addOnTotal;

			const savedItem = tx
				.insert(milkshakes)
				.values({
					transactionId: savedOrder.transactionId,
					recipeId: recipe.id,
					size: item.size,
				})
				.returning({ milkshakeId: milkshakes.id })
				.get();

			for (const addOn of savedAddOns) {
				tx.insert(milkshakeAddOns)
					.values({
						milkshakeId: savedItem.milkshakeId,
						ingredientId: addOn.ingredient.id,
						quantity: addOn.quantity,
					})
					.run();
			}

			total += subtotal;
		}

		return { transactionId: savedOrder.transactionId, total };
	});
}