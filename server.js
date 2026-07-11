import express from "express";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(import.meta.dirname));

app.post("/", (req, res) => {
	console.log(req.body);
	res.send("Order received");
});

app.listen(3000);
