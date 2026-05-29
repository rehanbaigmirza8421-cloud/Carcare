const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://backend_user01:baigsaab121314@cluster0.wnelqoy.mongodb.net/?appName=Cluster0')
    .then(() => {
        console.log('✅ MongoDB Connected');
    })
    .catch((err) => {
        console.error("FULL ERROR:");
        console.error(err);
    });

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


// test route
app.get("/", (req, res) => {
    res.send("Backend is running...");
});

// vehicle API
app.post("/vehicle", (req, res) => {
    console.log(req.body);
    res.json({ message: "Saved", data: req.body });
});

// server start
app.listen(PORT, () => {
    console.log("Server running on http://localhost:" + PORT);
});

