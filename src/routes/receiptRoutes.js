import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import {
	customerOrders,
	ingredients,
	milkshakeRecipes,
	orderItemAddOns,
	orderItems,
	staff,
} from "../db/schema.js";

const router = Router();

export function getReceipt(orderId) {
	const order = db
		.select({
			orderId: customerOrders.id,
			customerName: customerOrders.customerName,
			cashierName: staff.name,
			status: customerOrders.status,
			orderDateTime: customerOrders.createdAt,
			total: customerOrders.total,
		})
		.from(customerOrders)
		.innerJoin(staff, eq(customerOrders.cashierStaffId, staff.id))
		.where(eq(customerOrders.id, orderId))
		.get();

	if (!order) {
		return null;
	}

	const items = db
		.select({
			milkshakeId: orderItems.id,
			recipeName: milkshakeRecipes.name,
			size: orderItems.size,
			basePrice: orderItems.basePrice,
			subtotal: orderItems.subtotal,
		})
		.from(orderItems)
		.innerJoin(milkshakeRecipes, eq(orderItems.recipeId, milkshakeRecipes.id))
		.where(eq(orderItems.orderId, orderId))
		.all();

	const receiptItems = items.map((item) => ({
		...item,
		addOns: db
			.select({
				ingredientName: ingredients.name,
				quantity: orderItemAddOns.quantity,
				unitPrice: orderItemAddOns.unitPrice,
				subtotal: orderItemAddOns.subtotal,
			})
			.from(orderItemAddOns)
			.innerJoin(ingredients, eq(orderItemAddOns.ingredientId, ingredients.id))
			.where(eq(orderItemAddOns.orderItemId, item.milkshakeId))
			.all(),
	}));

	return { ...order, items: receiptItems };
}

router.get("/:orderId/receipt", (req, res) => {
	const orderId = Number(req.params.orderId);
	if (!Number.isInteger(orderId) || orderId <= 0) {
		return res.status(400).json({ error: "Order ID must be a positive number." });
	}

	const receipt = getReceipt(orderId);
	if (!receipt) {
		return res.status(404).json({ error: "Order not found." });
	}

	res.json({ receipt });
});

export default router;
