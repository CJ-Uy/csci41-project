import { Router } from "express";

const router = Router();

router.get("/:orderId/receipt", (req, res) => {
	if (!Number.isInteger(Number(req.params.orderId)) || Number(req.params.orderId) <= 0) {
		return res.status(400).json({ error: "Order ID must be a positive number." });
	}

	// Add the receipt query here.
	res.status(503).json({ error: "Database is not connected yet." });
});

export default router;
