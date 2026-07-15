import express from "express"; // Web server framework
import ejs from "ejs"; // Template engine used to render .html views
import { createOrder } from "./src/routes/orderRoutes.js";
import { getMenu } from "./src/routes/menuRoutes.js";

const app = express();

app.engine(".html", ejs.renderFile); // Render .html files using the EJS engine
app.set("view engine", "html"); // Default view file extension for res.render()

app.use(express.urlencoded({ extended: true })); // This allows us to read POST request bodies
app.use(express.static(".")); // Serves index.html (and any other root static files) automatically

function asList(value) {
	return Array.isArray(value) ? value : value ? [value] : [];
}

app.get("/menu", (req, res) => {
	res.json(getMenu());
});

app.post("/", (req, res) => {
	console.log(req.body);

	try {
		const recipes = asList(req.body.milkshake_recipe);
		const sizes = asList(req.body.size);
		const customizations = asList(req.body.customization);
		const quantities = asList(req.body.quantity);

		const order = createOrder({
			customerName: req.body.customer_name,
			cashierStaffId: Number(req.body.cashier_staff_id),
			items: recipes.map((recipeName, index) => {
				const addOnNames = asList(customizations[index]);
				const addOnQuantities = asList(quantities[index]);

				return {
					recipeName,
					size: sizes[index],
					addOns: addOnNames.map((ingredientName, addOnIndex) => ({
						ingredientName,
						quantity: Number(addOnQuantities[addOnIndex]),
					})),
				};
			}),
		});

		res.render("confirmation", {
			customer_name: req.body.customer_name,
			items: order.items,
			orderTotal: order.total,
			orderId: order.orderId,
			cashierName: order.cashierName,
			orderDate: new Date(order.date).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			}),
		});
	} catch (error) {
		res.status(400).send(error.message);
	}
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.log(`Open the application at http://localhost:${port}`);
});
