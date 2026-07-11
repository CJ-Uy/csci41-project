import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { ingredients, milkshakeRecipes, schedules, staff } from "../db/schema.js";

const router = Router();

router.get("/", (req, res) => {
	const cashiers = db
		.select({ staffId: staff.id, staffName: staff.name })
		.from(staff)
		.innerJoin(schedules, eq(schedules.staffId, staff.id))
		.where(eq(schedules.role, "cashier"))
		.all();

	const recipes = db.select().from(milkshakeRecipes).all().map((recipe) => ({
		recipeId: recipe.id,
		recipeName: recipe.name,
		sizes: ["8oz", "12oz", "16oz"].map((size) => ({
			size,
			basePrice: recipe.basePrice,
		})),
	}));

	const addOns = db.select().from(ingredients).all()
		.filter((ingredient) => ingredient.addOnPrice > 0)
		.map((ingredient) => ({
			ingredientId: ingredient.id,
			ingredientName: ingredient.name,
			pricePerServing: ingredient.addOnPrice,
			quantityOnHand: ingredient.quantity,
		}));

	res.json({ cashiers, recipes, addOns });
});

export default router;
