import express from "express"; // Web server framework
import ejs from "ejs"; // Template engine used to render .html views
import menuRoutes from "./src/routes/menuRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import receiptRoutes from "./src/routes/receiptRoutes.js";

const app = express();

app.engine(".html", ejs.renderFile); // Render .html files using the EJS engine
app.set("view engine", "html"); // Default view file extension for res.render()

app.use(express.urlencoded({ extended: true })); // This allows us to read POST request bodies
app.use(express.static(".")); // Serves index.html (and any other root static files) automatically
app.use(express.json()); // Needed only for the separate API routes below

app.post("/", (req, res) => {
	console.log(req.body);

	// Insert logic to store it to the database
	// Get the database instance

	res.render("Confirmation", req.body);
});

app.get("/api/health", (req, res) => {
	res.json({ status: "ok" });
});

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/orders", receiptRoutes);

app.listen(3000, () => {
	console.log("Open the application at http://localhost:3000");
});
