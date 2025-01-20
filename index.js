// const mongoose = require("mongoose");
// require("dotenv").config();
// mongoose.connect(process.env.MONGO)
//     .then(() => {
//         console.log("Connected to MongoDB");
//     })
//     .catch((error) => {
//         console.error("MongoDB connection error:", error);
//     });

// //------------Express importing-------------------
// const express = require("express");
// const app = express();
// const puppeteer = require('puppeteer');

// app.use(express.static("public"));

// const userRouter = require("./routes/userRouter");
// const adminRouter = require("./routes/adminRouter");

// app.use("/", userRouter);
// app.use("/admin", adminRouter);

// app.set("view engine", "ejs");
// app.set("views", "./views/users");

// // 404 handler for the entire application
// app.use((req, res) => {
//   res.status(404).render("404"); 
// });




// app.listen(5002, () => console.log("Server running...5002"));






    
//------------Express importing-------------------
const express = require("express");
const app = express();
const puppeteer = require('puppeteer');
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");

const mongoose = require("mongoose");
require("dotenv").config();
mongoose.connect(process.env.MONGO)
    .then(() => {
        console.log("Connected to MongoDB");
        require('./config/cronJobs');
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });


   

app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "./views/users");

// Body parsers to handle JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use("/", userRouter);
app.use("/admin", adminRouter);



// 404 handler for the entire application
app.use((req, res) => {
  res.status(404).render("404"); 
});




app.listen(5002, () => console.log("Server running...5002"));
