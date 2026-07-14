import express from "express"; // Web server framework
import ejs from "ejs"; // Template engine used to render .html views
import { createOrder } from "./src/routes/orderRoutes.js";

const app = express();

app.engine(".html", ejs.renderFile); // Render .html files using the EJS engine
app.set("view engine", "html"); // Default view file extension for res.render()

app.use(express.urlencoded({ extended: true })); // This allows us to read POST request bodies
app.use(express.static(".")); // Serves index.html (and any other root static files) automatically

function asList(value) {
	return Array.isArray(value) ? value : value ? [value] : [];
}

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

		res.render("Confirmation", {
			...req.body,
			milkshake_recipe: recipes,
			size: sizes,
			customization: recipes.map((_, index) => asList(customizations[index])),
			quantity: recipes.map((_, index) => asList(quantities[index])),
			orderTotal: order.total,
		});
	} catch (error) {
		res.status(400).send(error.message);
	}
});

app.listen(3000, () => {
	console.log("Open the application at http://localhost:3000");
});
