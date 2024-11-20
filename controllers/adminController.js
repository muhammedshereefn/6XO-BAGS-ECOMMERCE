const category = require("../models/category");

const User = require("../models/userModel");
const { Product } = require("../models/product");
const Admin = require("../models/adminModel");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Address = require("../models/addressModel");
const PDFDocument = require("pdfkit");
const Offer = require('../models/offerModel');


const loadLogin = async (req, res) => {
  try {
    res.render("login", { message: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyAdmin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await Admin.findOne({ email: email });

    if (adminData) {
      if (adminData.password === password) {
        if (adminData.is_admin === true) {
          res.render("login", { message: "Invalid Admin" });
        } else {
          req.session.admin_id = adminData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("login", { message: "Invalid Admin" });
      }
    } else {
      res.render("login", { message: "Invalid Admin" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    req.session.admin_id = null;
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const page = +req.query.page || 1; // Get the current page from query parameters

    const usersData = await User.find({ is_admin: 0 }).sort({ name: 1 });

    const products = await Product.find({ status: true });
    const cata = await category.find();

    const totalProducts = products.length;
    const totalCategories = cata.length;

    // Fetch orders with pagination
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    const totalOrders = await Order.countDocuments();

    // Calculate total revenue
    // const totalRevenue = await Order.aggregate([
    //   { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    // ]);

    const totalRevenueAggregate = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, totalPrice: { $sum: "$grandTotal" } } },
    ]);
    const totalRevenue =
      totalRevenueAggregate.length > 0
        ? totalRevenueAggregate[0].totalPrice
        : 0;

    const categorySales = await Order.aggregate([
      {
        $match: {
          status: "Delivered", // Filter by status
        },
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products", // Assuming your products collection is named 'products'
          localField: "products.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: "$productInfo",
      },
      {
        $group: {
          _id: "$productInfo.category", // Group by category
          totalSales: { $sum: "$products.quantity" }, // Calculate total sales quantity
        },
      },
    ]);

    // console.log(categorySales);

    // Monthly revenue calculation
    const monthlyRevenueAggregate = await Order.aggregate([
      {
        $match: {
          status: "Delivered", // Filter by status
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }, // If you want to consider the year as well
          },
          totalRevenue: { $sum: "$grandTotal" },
        },
      },
      {
        $sort: {
          "_id.month": 1, // Sort by month
        },
      },
    ]);

    // Extract total revenue for each month
    const monthlyRevenueArray = monthlyRevenueAggregate.map(
      (entry) => entry.totalRevenue
    );

    //-------------monthly sales-----------
    const monthlySales = await Order.aggregate([
      {
        $match: {
          status: "Delivered", // Filter by status
        },
      },
      {
        $group: {
          _id: {
            $month: "$createdAt",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
    const monthlySalesArray = Array.from({ length: 12 }, (_, index) => {
      const monthData = monthlySales.find((item) => item._id === index + 1);
      return monthData ? monthData.count : 0;
    });

    //---------monthly sales end----------------

    //---------product graph---------------
    const productsPerMonth = Array(12).fill(0);

    // Iterate through each product
    products.forEach((product) => {
      // Extract month from the createdAt timestamp
      const creationMonth = product.createdAt.getMonth(); // JavaScript months are 0-indexed

      // Increment the count for the corresponding month
      productsPerMonth[creationMonth]++;
    });
    //----------end product graph end

    const orderStatuses = await Order.aggregate([
      {
        $group: {
          _id: "$status", // Group by order status
          count: { $sum: 1 }, // Count the number of orders for each status
        },
      },
    ]);

    const topSellingProducts = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$products.product",
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: "$productInfo",
      },
      {
        $sort: {
          totalQuantity: -1, // Sort in descending order of total quantity
        },
      },
      {
        $limit: 5, // Adjust the limit based on how many top-selling products you want to display
      },
    ]);

    const topRevenueMonthsAggregate = await Order.aggregate([
      {
        $match: {
          status: "Delivered", // Filter by status
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }, // If you want to consider the year as well
          },
          totalRevenue: { $sum: "$grandTotal" },
        },
      },
      {
        $sort: {
          totalRevenue: -1, // Sort by total revenue in descending order
        },
      },
      {
        $limit: 5, // Choose the top N months
      },
    ]);

    // Extract top revenue and corresponding months
    const topRevenueMonthsData = topRevenueMonthsAggregate.map((entry) => ({
      month: entry._id.month,
      totalRevenue: entry.totalRevenue,
    }));

    // Extract month names for labels
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const topRevenueLabels = topRevenueMonthsData.map(
      (entry) => monthNames[entry.month - 1]
    );

    // Extract total revenue for each month
    const topRevenueValues = topRevenueMonthsData.map(
      (entry) => entry.totalRevenue
    );

    res.render("dashboard", {
      users: usersData,
      totalProducts,
      totalCategories,
      cata,
      totalOrders,
      totalRevenue,
      monthlySalesArray,
      productsPerMonth,
      monthlyRevenueArray,
      orders,
      categorySales,
      orderStatuses,
      topSellingProducts,
      topRevenueLabels: JSON.stringify(topRevenueLabels),
      topRevenueValues: JSON.stringify(topRevenueValues),
      currentPage: page,
      totalPages: Math.ceil(totalOrders / ITEMS_PER_PAGE),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const ITEMS_PER_PAGE = 5; // Number of users per page

const loadUserlist = async (req, res) => {
  try {
    const page = +req.query.page || 1;

    const totalUsers = await User.countDocuments({ is_admin: 0 });
    const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

    const usersData = await User.find({ is_admin: 0 })
      .sort({ name: 1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render("userList", {
      users: usersData,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadAddUser = async (req, res) => {
  try {
    res.render("newUser", { message: "", errMessage: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const addUser = async (req, res) => {
  try {
    const checkData = await User.findOne({ email: req.body.email });
    if (checkData) {
      res.render("newUser", {
        message: "",
        errMessage: "User already founded",
      });
    } else {
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        password: req.body.password,
      });

      const userData = await user.save();
      if (userData) {
        res.redirect("/admin/dashboard");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("editUser", { user: userData });
    } else {
      res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
        },
      }
    );
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const userData = await User.findOneAndRemove({ _id: req.query.id });
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const searchUser = async (req, res) => {
  try {
    const name = req.body.name;
    const usersData = await User.find({
      is_admin: 0,
      name: { $regex: name, $options: "i" },
    }).sort({ name: 1 });
    res.render("dashboard", { users: usersData });
  } catch (error) {
    console.log(error.message);
  }
};

const block = async (req, res) => {
  try {
    const userId = req.query.id;
    const blockUser = await User.findByIdAndUpdate(userId, { isBlocked: true });
    if (blockUser) {
      res.redirect("/admin/userlist"); // Redirect to the user list page
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.log(error);
  }
};

const unblock = async (req, res) => {
  try {
    const userId = req.query.id;
    const unblockUser = await User.findByIdAndUpdate(userId, {
      isBlocked: false,
    });
    if (unblockUser) {
      res.redirect("/admin/userlist"); // Redirect to the user list page
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadCategory = async (req, res) => {
  try {
    const page = +req.query.page || 1; // Get the current page from query parameters

    // Fetch categories with pagination
    const totalCategories = await category.countDocuments();
    const totalPages = Math.ceil(totalCategories / ITEMS_PER_PAGE);

    const categories = await category
      .find()
      .skip((page - 1) * ITEMS_PER_PAGE) // Skip records based on the current page
      .limit(ITEMS_PER_PAGE); // Limit the number of records per page

    res.render("categoryList", {
      category: categories,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const NameRegex = new RegExp(name, "i");

    const checkData = await category.findOne({ name: { $regex: NameRegex } });

    if (checkData) {
      const errMessage = "Category alredy exists";
      res.redirect(`/admin/category?error=${encodeURIComponent(errMessage)}`);
    } else {
      const newCategory = new category({
        name: name,
        description: description,
      });

      const saveData = await newCategory.save();
      if (saveData) {
        res.redirect("/admin/category");
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Sever Error");
  }
};

const blockCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;

    const blocked = await category.findByIdAndUpdate(categoryId, {
      isListed: false,
    });

    if (blocked) {
      res.redirect("/admin/category");
    } else {
      res.status(404).send("User Not Found");
    }
  } catch (error) {
    console.log(error);
  }
};

const unBlockCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;

    const unblocked = await category.findByIdAndUpdate(categoryId, {
      isListed: true,
    });

    if (unblocked) {
      res.redirect("/admin/category");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.log(error);
  }
};

const editcat = async (req, res, next) => {
  try {
    const categoryId = req.query.id;
    console.log(req.query.id);
    const categoryData = await category.findById(categoryId); // Use the renamed variable
    if (!categoryData) {
      return res.status(404).send("Category not found");
    } else {
      res.render("editcategory", { category: categoryData }); // Use the renamed variable
    }
  } catch (error) {
    console.log(error);
  }
};

const posteditCat = async (req, res) => {
  try {
    const Category = await category.findByIdAndUpdate(req.body.id, {
      $set: { name: req.body.name, description: req.body.description },
    });
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadProduct = async (req, res) => {
  try {
    const page = +req.query.page || 1; // Get the current page from query parameters

    // Fetch products with pagination
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    const products = await Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE) // Skip records based on the current page
      .limit(ITEMS_PER_PAGE); // Limit the number of records per page

    res.render("productList", {
      products,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const cata = await category.find({ isListed: true });
    res.render("addProduct", { cata });
  } catch (error) {
    console.log(error);
  }
};

const productadding = async (req, res) => {
  try {
    const prod = await Product.find();
    

    const newProduct = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      offerPrice: req.body.realPrice, 
      offerPercentage: req.body.offerPercentage,
      category: req.body.category,
      brand: req.body.brand,
      quantity: req.body.quantity,
      coverimage: "/products/" + req.session.images[0],
      images: [
        "/products/" + req.session.images[1],
        "/products/" + req.session.images[2],
        "/products/" + req.session.images[3],
      ],
    });

    await newProduct.save();
    req.session.images = null;

    res.redirect("/admin/productList?change=true");
  } catch (error) {
    console.log(error);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const products = await Product.findById(productId);

    const cata = await category.find({ isListed: true });

    res.render("editProduct", { products, cata });
  } catch (error) {
    console.log(error);
  }
};

const editProduct = async (req, res) => {
  try {
    const { id, name, description, price,offerPrice,offerPercentage, category, brand, quantity, coverimage, images } = req.body;

    // Find the product by ID
    const product = await Product.findById(id);

    // Update the product fields
    product.name = name;
    product.description = description;
    product.price = price;
    product.offerPrice = offerPrice;
    product.offerPercentage = offerPercentage;
    product.category = category;
    product.brand = brand;
    product.quantity = quantity;
   
   

    // // Check if the product has an offer field, and update it with the product's price
    // if (product.offerPrice !== undefined) {
    //   product.offerPrice = price;
    // }

    // Save the updated product
    await product.save();

    res.redirect("/admin/productList");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const productUnlist = async (req, res) => {
  try {
    const productId = req.query.id;
    const unBlockProduct = await Product.findByIdAndUpdate(productId, {
      status: true,
    });

    if (unBlockProduct) {
      res.redirect("/admin/productlist");
    } else {
      res.status(404).send("User not Found");
    }
  } catch (error) {
    console.log(error);
  }
};

const productList = async (req, res) => {
  try {
    const productId = req.query.id;
    const blockProduct = await Product.findByIdAndUpdate(productId, {
      status: false,
    });

    if (blockProduct) {
      res.redirect("/admin/productlist");
    } else {
      res.status(404).send("user not Found");
    }
  } catch (error) {
    console.log(error);
  }
};



const loadMainOfferPage = async (req, res) => {
  try {
    // Fetch all offers from the database
    const offers = await Offer.find(); // You can add filters or sorting if needed

    // Render the main offer form and pass the offers to the view
    res.render("MainOffer", { offers }); // Pass the offers to the view
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error"); // Handle errors appropriately
  }
};


const addMainOffer = async (req, res) => {
  try {
    const { title, description, hours, minutes, seconds } = req.body;

    // Create a new offer instance with the timer structured correctly
    const newOffer = new Offer({
      title,
      description,
      timer: {
        hours: parseInt(hours),
        minutes: parseInt(minutes),
        seconds: parseInt(seconds)
      }
    });

    // Save the offer to the database
    await newOffer.save();
    res.redirect("/admin/MainOffer"); 
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error"); 
  }
};




const removeOffer = async (req, res) => {
  try {
      const offerId = req.params.id; // Get the offer ID from the request parameters

      // Find and delete the offer by its ID
      const result = await Offer.findByIdAndDelete(offerId);

      if (!result) {
          return res.status(404).send('Offer not found'); // Handle case where offer does not exist
      }

      res.redirect('/admin/MainOffer'); // Redirect to dashboard after deletion
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error'); // Handle server errors
  }
};



const loadOrderManagementPage = async (req, res) => {
  try {
    const page = +req.query.page || 1; // Get the current page from query parameters

    // Fetch orders with pagination
    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

    const orders = await Order.find()
      .populate("products.product")
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE) // Skip records based on the current page
      .limit(ITEMS_PER_PAGE); // Limit the number of records per page

    if (!orders || orders.length === 0) {
      console.log("No orders found.");
    } else {
      console.log("Orders found:", orders);
    }

    res.render("ordersList", {
      orders,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
};

const orderConform = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "Confirm" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.redirect("/admin/orderManagement");
  } catch (error) {}
};


const orderShipped = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "Shipped" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Redirect to the order management page
    res.redirect("/admin/orderManagement");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};



const orderPending = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "Pending" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.redirect("/admin/orderManagement");
  } catch (error) {}
};

const orderDelivered = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "Delivered" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.redirect("/admin/orderManagement");
  } catch (error) {}
};

const ordercancle = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Find the order and populate the 'products' field
    const order = await Order.findById(orderId).populate("products.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update product quantities based on the canceled order
    order.products.forEach(async (productInfo) => {
      const product = productInfo.product;
      const quantityToIncrease = productInfo.quantity;

      // Increase the product quantity
      await Product.findByIdAndUpdate(product._id, {
        $inc: { quantity: quantityToIncrease },
      });
    });

    // Update the order status to "Cancelled"
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: "Cancelled" },
      { new: true }
    );

    res.redirect("/admin/orderManagement");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loadSalesReport = async (req, res) => {
  try {
    const orders = await Order.find({ status: "Delivered" })
      .populate("user")
      .sort({ createdAt: -1 });
    res.render("salesReport", { orders });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
};

const sales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Perform a MongoDB query to get sales data within the specified date range
    const filteredSales = await Order.find({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: "Delivered", // Add this condition to filter by status
    });

    console.log(filteredSales + "/////");
    res.json(filteredSales);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const SalesReport = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let orders;

    const currentDate = new Date();

    // Helper function to get the first day of the current month
    function getFirstDayOfMonth(date) {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    // Helper function to get the first day of the current year
    function getFirstDayOfYear(date) {
      return new Date(date.getFullYear(), 0, 1);
    }

    switch (date) {
      case "today":
        orders = await Order.find({
          status: "Delivered",
          createdAt: {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lt: new Date().setHours(23, 59, 59, 999),
          },
        });
        break;
      case "week":
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        orders = await Order.find({
          status: "Delivered",
          createdAt: {
            $gte: startOfWeek,
            $lt: endOfWeek,
          },
        }).populate("user");
        break;
      case "month":
        const startOfMonth = getFirstDayOfMonth(currentDate);
        const endOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );

        orders = await Order.find({
          status: "Delivered",
          createdAt: {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
        }).populate("user");
        break;
      case "year":
        const startOfYear = getFirstDayOfYear(currentDate);
        const endOfYear = new Date(
          currentDate.getFullYear() + 1,
          0,
          0,
          0,
          0,
          0,
          0
        );

        orders = await Order.find({
          status: "Delivered",
          createdAt: {
            $gte: startOfYear,
            $lt: endOfYear,
          },
        }).populate("user");
        break;
      case "custom":
        orders = await Order.find({
          status: "Delivered",
          createdAt: {
            $gte: new Date(startDate),
            $lt: new Date(endDate),
          },
        }).populate("user");
        break;
      default:
        orders = await Order.find({ status: "Delivered" }).populate("user");
    }

    const itemsPerPage = 3;
    const currentPage = parseInt(req.query.page) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalPages = Math.ceil(orders.length / itemsPerPage);
    const currentProduct = orders.slice(startIndex, endIndex);

    if (req.query.downloadPdf) {
      const doc = new PDFDocument();
      // Customize your PDF content here based on the sales report data
      doc.text("Sales Report", { align: "center" });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: "center" });
      doc.moveDown();
      let orderCounter = 0;
      // Add your sales data to the PDF
      orders.forEach((order) => {
        doc.text(`Order ID: ORD${String(orderCounter++).padStart(5, "0")}`, {
          fontSize: 12,
        });
        doc.text(`Customer Name: ${order.user ? order.user.name : "N/A"}`, {
          fontSize: 12,
        });
        doc.text(`Price: ${order.grandTotal}`, { fontSize: 12 });
        doc.text(`Status: ${order.status}`, { fontSize: 12 });
        doc.text(
          `Date: ${
            order.createdAt ? order.createdAt.toLocaleDateString() : "N/A"
          }`,
          { fontSize: 12 }
        );
        doc.moveDown(); // Add spacing between entries
      });

      // Set the response headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="sales_report.pdf"'
      );

      // Pipe the PDF content to the response stream
      doc.pipe(res);
      doc.end();
    } else {
      // Continue with the existing logic for rendering the HTML page
      res.render("salesReport", {
        orders: currentProduct,
        totalPages,
        currentPage,
        startDate,
        endDate,
      });
    }
  } catch (error) {
    console.log("Error occurred in salesReport route:", error);
    res.status(500).json({ error: "An error occurred" });
  }
};

const downloadPdf = async (req, res) => {
  try {
    // ... Your existing sales report generation logic ...

    // Generate PDF using pdfkit
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.pdf"
    );
    doc.pipe(res);

    // Add PDF content here
    doc.text("Sales Report", { align: "center", underline: true });
    // ... Add more content based on your requirements ...

    doc.end();
  } catch (error) {
    console.log("Error occurred in downloadPdf route:", error);
    res.status(500).json({ error: "An error occurred" });
  }
};

const loadOrderDetailsPage = async (req, res) => {
  try {
    // const usersData = await User.find({ is_admin: 0 }).sort({ name: 1 });
    const order = await Order.findById(req.query.id)
      .populate("user")
      .populate("products.product");

    console.log(order);

    res.render("orderDetail", { order });
  } catch (error) {
    console.log(error);
  }
};

const loadProductOfferPage = async (req, res) => {
  try {
    const ITEMS_PER_PAGE = 4;
    const page = +req.query.page || 1;

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    const product = await Product.find()
      .sort({ name: 1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render("productOffer", {
      product,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// updating the product offer-------------------------------------------------
const updateProductOffer = async (req, res) => {
  try {
    const { id, offerPrice } = req.body;

    const product = await Product.findById(id);

    const cappedPercentage = Math.min(offerPrice, 100);
    const percentage = (product.price * cappedPercentage) / 100;
    product.offerPrice = Math.round(product.price - percentage);
    product.offerPercentage = cappedPercentage;
    await product.save();

    // console.log(product.offerPrice, 'updated product price///////////////////////////////');

    // Redirect to the page where you display the updated offer
    res.redirect("/admin/productOffer");
  } catch (error) {
    console.log(error, "error");
    res.status(500).send("Internal Server Error");
  }
};

const loadCategoryOffer = async (req, res) => {
  try {
    const categories = await category.find();

    res.render("categoryOffer", { categories });
  } catch (error) {
    console.log(
      "Error happened in the offerctrl in the function catogaryOffer:",
      error
    );
    res.status(500).send("Internal Server Error");
  }
};

const updateCategoryOffer = async (req, res) => {
  try {
    const { id, offerPercentage } = req.body;
    // Find the category
    const foundCategory = await category.findById(id);

    console.log(foundCategory);

    // Find all products in the category
    const products = await Product.find({ category: foundCategory.name });
    console.log(products);

    // Update prices based on the offer percentage
    await Promise.all(
      products.map(async (product) => {
        const discountAmount = (offerPercentage / 100) * product.price;
        const newOfferPrice = Math.round(product.price - discountAmount);

        await Product.findByIdAndUpdate(product._id, {
          offerPrice: newOfferPrice,
          price: product.price, // Assuming you want to keep the original price
        });
      })
    );

    console.log("Updated prices for products in category:", foundCategory.name);

    res.redirect("/admin/categoryOffer");
  } catch (error) {
    console.log(
      "Error happened in the offerctrl in the function updateCategoryOffer:",
      error
    );
    // Handle the error appropriately, e.g., send an error response to the client
    res.status(500).render("users/page-500", { error: error.message });
  }
};

/////////-------------coupon--------------------------------

const loadCreateCouponPage = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render("createCoupon", { coupons });
  } catch (error) {
    console.log(error);
  }
};
const loadAddCouponForm = async (req, res) => {
  try {
    res.render("addCouponForm");
  } catch (error) {
    console.log(error);
  }
};

const generateCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, minimumAmount, expirationDate } =
      req.body;

    // Create a new Coupon instance with the provided data
    const newCoupon = new Coupon({
      code,
      discountPercentage,
      minimumAmount,
      expirationDate,
    });

    // Save the new coupon to the database
    await newCoupon.save();

    console.log("Coupon created successfully");
    res.redirect("/admin/loadCreateCoupon");
  } catch (error) {
    console.error("Error generating coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    console.log("Received coupon code:", code);

    // Find the coupon in the database based on the provided code
    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      // Coupon not found
      return res
        .status(200)
        .json({ success: false, message: "Coupon not found" });
    }

    // Check if the coupon is still active
    if (!coupon.isActive) {
      return res
        .status(200)
        .json({ success: false, message: "Coupon is not active" });
    }

    // Check if the coupon has expired
    const currentDate = new Date();
    if (coupon.expirationDate < currentDate) {
      return res
        .status(200)
        .json({ success: false, message: "Coupon has expired" });
    }

    // Fetch the order associated with the user (assuming the order is tied to the user)
    const userId = req.session.user_id; // Update this based on your user identification logic
    const order = await Order.findOne({
      user: userId,
      status: "Pending",
    }).populate("products.product");
    console.log(order, ">>>>>><<<<<<<<<<<<<<<<<>>>>>>>>>>>><|||||||||||||||");

    if (!order) {
      return res
        .status(200)
        .json({
          success: false,
          message: "No pending order found for the user",
        });
    }

    // Get the total order amount from the grandTotal field
    const orderTotal = order.grandTotal;
    console.log("Original Order Total:", orderTotal);

    // Check if the order total meets the minimum amount required for the coupon
    if (orderTotal < coupon.minimumAmount) {
      return res
        .status(200)
        .json({
          success: false,
          message:
            "Order total does not meet the minimum amount required for the coupon",
        });
    }

    console.log("Coupon is valid");
    const discountPercentage = coupon.discountPercentage;

    // Calculate the discount amount
    const discountAmount = (orderTotal * discountPercentage) / 100;

    // Calculate the discounted total
    const discountedTotal = orderTotal - discountAmount;

    // Update the order with the discounted total
    await updateOrderTotal(order._id, discountedTotal);

    console.log("Discounted Total:", discountedTotal);

    return res.status(200).json({ success: true, discountedTotal });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const loadEditCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    const coupon = await Coupon.findById(id);

    res.render("editCoupon", { coupon });
  } catch (error) {
    console.log(error);
  }
};
const deleteCoupon = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    const coupon = await Coupon.findByIdAndDelete(id);

    res.redirect("/admin/loadCreateCoupon");
  } catch (error) {
    console.log(
      "Error happence in the coupon controller in the funtion deleteCoupon",
      error
    );
  }
};



const deleteImage = async (req, res) => {
  try {
    console.log("Ethii");
      const productId = req.params.id;
      const imageUrlToDelete = req.body.imageUrl;

      // Find the product by ID and update the images array
      const product = await Product.findByIdAndUpdate(
          productId,
          { $pull: { images: imageUrlToDelete } },
          { new: true } // To get the updated document
      );

      res.status(200).json({ success: true, updatedImages: product.images });
  } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = {
  loadLogin,
  verifyAdmin,
  loadUserlist,
  logout,
  loadDashboard,
  loadAddUser,
  addUser,
  editUserLoad,
  updateUser,
  deleteUser,
  searchUser,
  block,
  unblock,
  loadCategory,
  createCategory,
  blockCategory,
  unBlockCategory,
  editcat,
  posteditCat,
  loadProduct,
  loadAddProduct,
  productadding,
  loadEditProduct,
  editProduct,
  productUnlist,
  productList,
  loadOrderManagementPage,
  orderConform,
  orderDelivered,
  orderPending,
  ordercancle,
  loadSalesReport,
  SalesReport,
  loadOrderDetailsPage,
  downloadPdf,
  sales,
  loadProductOfferPage,
  updateProductOffer,
  loadCategoryOffer,
  updateCategoryOffer,
  loadCreateCouponPage,
  loadAddCouponForm,
  generateCoupon,
  validateCoupon,
  loadEditCoupon,
  deleteCoupon,
  deleteImage,
  loadMainOfferPage,
  addMainOffer,
  removeOffer,
  orderShipped
};

