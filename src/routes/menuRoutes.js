import { db } from "../db/index.js";
import { ingredient, recipe } from "../db/schema.js";

// Prices for the live totals on the order page, keyed by the option
// names the form already uses.
export function getMenu() {
	const recipes = {};
	for (const row of db.select().from(recipe).all()) {
		recipes[row.name] = {
			"8oz": row.basePrice8oz,
			"12oz": row.basePrice12oz,
			"16oz": row.basePrice16oz,
		};
	}

	// Any ingredient can be added to (or removed from) a shake.
	const addOns = {};
	for (const row of db.select().from(ingredient).all()) {
		addOns[row.name] = row.pricePerServing;
	}

	return { recipes, addOns };
}
