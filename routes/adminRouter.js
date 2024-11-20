const express = require("express");
const adminRouter = express();
const nocache = require("nocache");
const logger = require("morgan");
const pdfkit = require("pdfkit");

//upload multer///

const { upload } = require("../multer/multer");

const session = require("express-session");
const config = require("../config/config");

adminRouter.use(
  session({
    secret: config.sessionSecretId,
    resave: false,
    saveUninitialized: true,
  })
);

const bodyParser = require("body-parser");
adminRouter.use(nocache());
adminRouter.use(logger("dev"));
adminRouter.set("view engine", "ejs");
adminRouter.set("views", "./views/admin");

adminRouter.use(bodyParser.json());
adminRouter.use(bodyParser.urlencoded({ extended: true }));

const auth = require("../middleware/adminAuth");
const adminController = require("../controllers/adminController");
adminRouter.get("/", auth.isLogout, adminController.loadLogin);
adminRouter.post("/", adminController.verifyAdmin);


adminRouter.get("/logout", auth.isLogin, adminController.logout);
adminRouter.get("/dashboard", auth.isLogin, adminController.loadDashboard);

//-----------------------------USER MANAGEMENT--------------------------------------------------

adminRouter.get("/newUser", auth.isLogin, adminController.loadAddUser);
adminRouter.post("/newUser", auth.isLogin, adminController.addUser);
adminRouter.get("/editUser", auth.isLogin, adminController.editUserLoad);
adminRouter.post("/editUser", auth.isLogin, adminController.updateUser);
adminRouter.get("/deleteUser", auth.isLogin, adminController.deleteUser);
adminRouter.get("/userlist", auth.isLogin, adminController.loadUserlist);
adminRouter.post("/searchUser", auth.isLogin, adminController.searchUser);
adminRouter.get("/block", auth.isLogin, adminController.block);
adminRouter.get("/unblock", auth.isLogin, adminController.unblock);


//-----------------------------CATEGORY MANEGMENT--------------------------------------------------

adminRouter.get("/category", auth.isLogin, adminController.loadCategory);
adminRouter.post(
  "/createCategory",
  auth.isLogin,
  adminController.createCategory
);
adminRouter.get("/category/block", auth.isLogin, adminController.blockCategory);
adminRouter.get(
  "/category/unblock",
  auth.isLogin,
  adminController.unBlockCategory
);
adminRouter.get("/categoryEdit", auth.isLogin, adminController.editcat);
adminRouter.post("/editingcat", auth.isLogin, adminController.posteditCat);

//-----------------------------PRODUCT MANEGMENT--------------------------------------------------

adminRouter.get("/productlist", auth.isLogin, adminController.loadProduct);
adminRouter.get("/addproduct", auth.isLogin, adminController.loadAddProduct);
adminRouter.post(
  "/addproduct",
  upload.fields([{ name: "coverimage", maxCount: 1 }, { name: "images" }]),
  adminController.productadding
);
adminRouter.get("/editproduct", auth.isLogin, adminController.loadEditProduct);
adminRouter.post(
  "/editproduct",
  upload.fields([{ name: "images" }]),
  auth.isLogin,
  adminController.editProduct
);
adminRouter.get("/productunblock", auth.isLogin, adminController.productUnlist);
adminRouter.get("/productblock", auth.isLogin, adminController.productList);


//-----------------------------ORDER MANEGMENT--------------------------------------------------

adminRouter.get(
  "/orderManagement",
  auth.isLogin,
  adminController.loadOrderManagementPage
);
adminRouter.get(
  "/orderConform/:orderId",
  auth.isLogin,
  adminController.orderConform
);
adminRouter.get(
  "/orderDelivered/:orderId",
  auth.isLogin,
  adminController.orderDelivered
);
adminRouter.get(
  "/orderPending/:orderId",
  auth.isLogin,
  adminController.orderPending
);

adminRouter.get(
  "/orderShipped/:orderId",
  auth.isLogin,
  adminController.orderShipped
);


adminRouter.get(
  "/orderCancel/:orderId",
  auth.isLogin,
  adminController.ordercancle
);
adminRouter.get(
  "/orderDetail",
  auth.isLogin,
  adminController.loadOrderDetailsPage
);


//-----------------------------SALES REPORT--------------------------------------------------

adminRouter.get("/salesReport", auth.isLogin, adminController.loadSalesReport);
adminRouter.get("/salesReportt", auth.isLogin, adminController.SalesReport);
adminRouter.get("/downloadPdf", auth.isLogin, adminController.downloadPdf);
adminRouter.get("/sales", auth.isLogin, adminController.sales);


//-----------------------------PRODUCT OFFERS--------------------------------------------------
adminRouter.get(
  "/productOffer",
  auth.isLogin,
  adminController.loadProductOfferPage
);
adminRouter.post(
  "/updateOffer",
  auth.isLogin,
  adminController.updateProductOffer
);

adminRouter.get("/MainOffer", auth.isLogin, adminController.loadMainOfferPage);
adminRouter.post("/addMainOffer", auth.isLogin, adminController.addMainOffer);

adminRouter.post('/removeOffer/:id', auth.isLogin, adminController.removeOffer);

//----------------------------CATEGORY OFFERS--------------------------------------------------

adminRouter.get(
  "/categoryOffer",
  auth.isLogin,
  adminController.loadCategoryOffer
);
adminRouter.post(
  "/updatecategoryOffer",
  auth.isLogin,
  adminController.updateCategoryOffer
);

//----------------------COUPON MANEGMENT---------------------------

adminRouter.get(
  "/loadCreateCoupon",
  auth.isLogin,
  adminController.loadCreateCouponPage
);
adminRouter.get(
  "/loadAddCoupon",
  auth.isLogin,
  adminController.loadAddCouponForm
);
adminRouter.post(
  "/generateCoupon",
  auth.isLogin,
  adminController.generateCoupon
);
adminRouter.get("/editcoupon", auth.isLogin, adminController.loadEditCoupon);
adminRouter.get("/deleteCoupon", auth.isLogin, adminController.deleteCoupon);


adminRouter.post('/admin/deleteImage/:id', adminController.deleteImage);

//-----------------------------END--------------------------------------------------

adminRouter.get("*", (req, res) => {
  res.redirect("/admin");
});

module.exports = adminRouter;
