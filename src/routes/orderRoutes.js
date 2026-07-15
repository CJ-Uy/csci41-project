import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	customization,
	ingredient,
	milkshake,
	milkshakeRecipe,
	recipe,
	staff,
	transaction,
} from "../db/schema.js";

const validSizes = ["8oz", "12oz", "16oz"];

function basePriceFor(recipeRow, size) {
	return {
		"8oz": recipeRow.basePrice8oz,
		"12oz": recipeRow.basePrice12oz,
		"16oz": recipeRow.basePrice16oz,
	}[size];
}

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

		// Resolve and price every item before inserting anything, since
		// transaction.total_cost is NOT NULL and must be known up front.
		const pricedItems = items.map((item) => {
			if (!validSizes.includes(item.size)) {
				throw new Error("Milkshake size must be 8oz, 12oz, or 16oz.");
			}

			const recipeRow = item.recipeId
				? tx.select().from(recipe).where(eq(recipe.id, item.recipeId)).get()
				: tx
						.select()
						.from(recipe)
						.where(eq(recipe.name, item.recipeName))
						.get();

			if (!recipeRow) {
				throw new Error("Selected milkshake recipe does not exist.");
			}

			const addOns = (item.addOns || []).map((addOn) => {
				// Negative quantity = removing servings; only zero is meaningless.
				if (!Number.isInteger(addOn.quantity) || addOn.quantity === 0) {
					throw new Error("Add-on quantity must be a non-zero integer.");
				}

				const ingredientRow = addOn.ingredientId
					? tx
							.select()
							.from(ingredient)
							.where(eq(ingredient.id, addOn.ingredientId))
							.get()
					: tx
							.select()
							.from(ingredient)
							.where(eq(ingredient.name, addOn.ingredientName))
							.get();

				if (!ingredientRow) {
					throw new Error("Selected add-on does not exist.");
				}

				if (
					ingredientRow.category !== "add-on" ||
					ingredientRow.pricePerServing <= 0
				) {
					throw new Error("Selected ingredient is not an available add-on.");
				}

				return { ingredient: ingredientRow, quantity: addOn.quantity };
			});

			const addOnTotal = addOns.reduce(
				(sum, addOn) => sum + addOn.ingredient.pricePerServing * addOn.quantity,
				0,
			);
			const subtotal =
				Math.round((basePriceFor(recipeRow, item.size) + addOnTotal) * 100) /
				100;

			return { recipe: recipeRow, size: item.size, addOns, subtotal };
		});

		const total =
			Math.round(
				pricedItems.reduce((sum, item) => sum + item.subtotal, 0) * 100,
			) / 100;

		const savedTransaction = tx
			.insert(transaction)
			.values({
				customerName: customerName.trim(),
				staffId: cashierStaffId,
				totalCost: total,
			})
			.returning({ txn: transaction.id })
			.get();

		for (const item of pricedItems) {
			const savedMilkshake = tx
				.insert(milkshake)
				.values({
					subtotal: item.subtotal,
					txn: savedTransaction.txn,
					ingredientId: item.recipe.ingredientId,
					recipeId: item.recipe.id,
				})
				.returning({ milkshakeId: milkshake.id })
				.get();

			tx.insert(milkshakeRecipe)
				.values({
					milkshakeId: savedMilkshake.milkshakeId,
					recipeId: item.recipe.id,
					milkshakeSize: item.size,
				})
				.run();

			for (const addOn of item.addOns) {
				tx.insert(customization)
					.values({
						milkshakeId: savedMilkshake.milkshakeId,
						ingredientId: addOn.ingredient.id,
						customizationQty: addOn.quantity,
					})
					.run();
			}
		}

		return { orderId: savedTransaction.txn, total };
	});
}
