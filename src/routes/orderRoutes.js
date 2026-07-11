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
import { getReceipt } from "./receiptRoutes.js";

const router = Router();
const validSizes = ["8oz", "12oz", "16oz"];

export function getOrders() {
	return db
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
		.all()
		.map((order) => ({
			...order,
			itemCount: db.select().from(orderItems).where(eq(orderItems.orderId, order.orderId)).all().length,
		}));
}

router.get("/", (req, res) => {
	res.json({ orders: getOrders() });
});

export function createOrder(orderData) {
	const { customerName, cashierStaffId, items } = orderData;

	if (!customerName?.trim() || !Number.isInteger(cashierStaffId) || cashierStaffId <= 0 || !Array.isArray(items) || items.length === 0) {
		throw new Error("Please provide a customer, cashier, and at least one milkshake.");
	}

	return db.transaction((tx) => {
		const cashier = tx.select().from(staff).where(eq(staff.id, cashierStaffId)).get();
		if (!cashier) {
			throw new Error("Selected cashier does not exist.");
		}

		const savedOrder = tx
			.insert(customerOrders)
			.values({ customerName: customerName.trim(), cashierStaffId, total: 0 })
			.returning({ orderId: customerOrders.id })
			.get();

		let total = 0;

		for (const item of items) {
			if (!validSizes.includes(item.size)) {
				throw new Error("Milkshake size must be 8oz, 12oz, or 16oz.");
			}

			const recipe = item.recipeId
				? tx.select().from(milkshakeRecipes).where(eq(milkshakeRecipes.id, item.recipeId)).get()
				: tx.select().from(milkshakeRecipes).where(eq(milkshakeRecipes.name, item.recipeName)).get();

			if (!recipe) {
				throw new Error("Selected milkshake recipe does not exist.");
			}

			const addOns = item.addOns || [];
			let addOnTotal = 0;
			const savedAddOns = [];

			for (const addOn of addOns) {
				if (!Number.isInteger(addOn.quantity) || addOn.quantity <= 0) {
					throw new Error("Add-on quantity must be a positive number.");
				}

				const ingredient = addOn.ingredientId
					? tx.select().from(ingredients).where(eq(ingredients.id, addOn.ingredientId)).get()
					: tx.select().from(ingredients).where(eq(ingredients.name, addOn.ingredientName)).get();

				if (!ingredient) {
					throw new Error("Selected add-on does not exist.");
				}

				const subtotal = ingredient.addOnPrice * addOn.quantity;
				addOnTotal += subtotal;
				savedAddOns.push({ ingredient, quantity: addOn.quantity, subtotal });
			}

			const subtotal = recipe.basePrice + addOnTotal;
			const savedItem = tx
				.insert(orderItems)
				.values({
					orderId: savedOrder.orderId,
					recipeId: recipe.id,
					size: item.size,
					basePrice: recipe.basePrice,
					subtotal,
				})
				.returning({ orderItemId: orderItems.id })
				.get();

			for (const addOn of savedAddOns) {
				tx.insert(orderItemAddOns).values({
					orderItemId: savedItem.orderItemId,
					ingredientId: addOn.ingredient.id,
					quantity: addOn.quantity,
					unitPrice: addOn.ingredient.addOnPrice,
					subtotal: addOn.subtotal,
				}).run();
			}

			total += subtotal;
		}

		tx.update(customerOrders).set({ total }).where(eq(customerOrders.id, savedOrder.orderId)).run();
		return { orderId: savedOrder.orderId, total };
	});
}

router.post("/", (req, res) => {
	try {
		const order = createOrder(req.body);
		res.status(201).json({
			message: "Order saved",
			order,
			receipt: getReceipt(order.orderId),
		});
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

export default router;
