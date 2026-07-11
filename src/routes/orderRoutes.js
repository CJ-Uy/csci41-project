import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
	// Add the query for saved orders here.
	res.status(503).json({ error: "Database is not connected yet." });
});

router.post("/", (req, res) => {
	const { customerName, cashierStaffId, items } = req.body;
	const validSizes = ["8oz", "12oz", "16oz"];
	const validItems = Array.isArray(items) && items.length > 0 && items.every((item) => {
		const validAddOns = !item.addOns || (Array.isArray(item.addOns) && item.addOns.every((addOn) => (
			Number.isInteger(addOn.ingredientId) && Number.isInteger(addOn.quantity) && addOn.quantity > 0
		)));

		return Number.isInteger(item.recipeId) && validSizes.includes(item.size) && validAddOns;
	});

	if (!customerName || !Number.isInteger(cashierStaffId) || cashierStaffId <= 0 || !validItems) {
		return res.status(400).json({ error: "Please provide a customer, cashier, and valid milkshake items." });
	}

	// Drizzle insert logic after the database tables are finished.
	res.status(503).json({ error: "Database is not connected yet." });
});

export default router;
