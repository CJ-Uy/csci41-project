import express from "express"; // Web server framework
import ejs from "ejs"; // Template engine used to render .html views

const app = express();

app.engine(".html", ejs.renderFile); // Render .html files using the EJS engine
app.set("view engine", "html"); // Default view file extension for res.render()

app.use(express.urlencoded({ extended: true })); // This allows us to read POST request bodies
app.use(express.static(".")); // Serves index.html (and any other root static files) automatically

app.post("/", (req, res) => {
	console.log(req.body);

	// Insert logic to store it to the database
	// Get the database instance

	res.render("Confirmation", req.body); 
});

// Start server
app.listen(3000, () => console.log("Open the application at http://localhost:3000"));
