import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
	// Drizzle query for recipes, cashiers, and add-ons here.
	res.status(503).json({ error: "Database is not connected yet." });
});

export default router;
