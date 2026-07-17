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

			const customizations = (item.customizations || []).map(
				(customizationItem) => {
					// Negative quantity = removing servings; only zero is meaningless.
					if (
						!Number.isInteger(customizationItem.quantity) ||
						customizationItem.quantity === 0
					) {
						throw new Error(
							"Customization quantity must be a non-zero integer.",
						);
					}

					const ingredientRow = customizationItem.ingredientId
						? tx
								.select()
								.from(ingredient)
								.where(eq(ingredient.id, customizationItem.ingredientId))
								.get()
						: tx
								.select()
								.from(ingredient)
								.where(eq(ingredient.name, customizationItem.ingredientName))
								.get();

					if (!ingredientRow) {
						throw new Error("Selected customization does not exist.");
					}

					return {
						ingredient: ingredientRow,
						quantity: customizationItem.quantity,
					};
				},
			);

			// Removals (negative quantity) refund their per-serving price,
			// matching the spec receipt, e.g. "--- whipped cream (10.00)".
			const customizationTotal = customizations.reduce(
				(sum, customizationItem) =>
					sum +
					customizationItem.ingredient.pricePerServing *
						customizationItem.quantity,
				0,
			);
			// Floor at 0 so heavy removals can't produce a negative subtotal
			// (DB nonneg check would reject it anyway).
			const subtotal = Math.max(
				0,
				Math.round(
					(basePriceFor(recipeRow, item.size) + customizationTotal) * 100,
				) / 100,
			);

			return { recipe: recipeRow, size: item.size, customizations, subtotal };
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
			.returning({ txn: transaction.id, date: transaction.date })
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

			for (const customizationItem of item.customizations) {
				tx.insert(customization)
					.values({
						milkshakeId: savedMilkshake.milkshakeId,
						ingredientId: customizationItem.ingredient.id,
						customizationQty: customizationItem.quantity,
					})
					.run();
			}
		}

		return {
			orderId: savedTransaction.txn,
			total,
			date: savedTransaction.date,
			cashierName: cashier.name,
			// Receipt breakdown: per-line prices as the server actually charged them.
			items: pricedItems.map((item) => ({
				recipeName: item.recipe.name,
				size: item.size,
				basePrice: basePriceFor(item.recipe, item.size),
				subtotal: item.subtotal,
				customizations: item.customizations.map((customizationItem) => ({
					name: customizationItem.ingredient.name,
					quantity: customizationItem.quantity,
					lineTotal:
						Math.round(
							customizationItem.ingredient.pricePerServing *
								customizationItem.quantity *
								100,
						) / 100,
				})),
			})),
		};
	});
}
