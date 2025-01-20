const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const nocache = require("nocache");
const logger = require("morgan");
const userRouter = express();
const puppeteer = require("puppeteer");
const auth = require("../middleware/authentication");
const userController = require("../controllers/userController");

const config = require("../config/config");
userRouter.use(nocache());
userRouter.use(
  session({
    secret: config.sessionSecretId,
    resave: false,
    saveUninitialized: true,
  })
);
userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({ extended: true }));
userRouter.use(logger("dev"));
userRouter.set("view engine", "ejs");
userRouter.set("views", "./views/users");

// registration user
userRouter.get("/register", auth.isLogout, userController.loadRegister);
userRouter.post("/register", userController.insertUser);



userRouter.get("/terms&conditions", userController.loadTermsandConditions);
userRouter.get("/privacy&policy", userController.loadPrivacyandPolicies);
userRouter.get("/contact-us", userController.loadContactUs);
userRouter.get("/refundPolicy", userController.loadRefundPolicy);


// login user

userRouter.get("/", auth.isLogout, userController.loaddLogin);
userRouter.get("/login", auth.isLogout, userController.loadLogin);
userRouter.post("/login", auth.isLogout, userController.verfiyUser);

userRouter.get("/home", auth.isLogin, userController.loadHome);

userRouter.get("/productdetails/:id", userController.loadProductDetails);

userRouter.get("/categoryPage", auth.isLogin, userController.loadCategoryPage);

userRouter.get("/profile", auth.isLogin, userController.loadProfilePage);
userRouter.post(
  "/updateProfile",
  auth.isLogin,
  userController.updateUserProfile
);

//-----------------------------ADDRESS--------------------------------------------------


userRouter.get("/addAddress", auth.isLogin, userController.loadAddAddress);
userRouter.post("/addAddress", auth.isLogin, userController.addressAdding);
userRouter.get(
  "/editAddress/:addressId",
  auth.isLogin,
  userController.loadAddressEdit
);
userRouter.post("/editAddress/:addressId", userController.editingAddress);
userRouter.post("/deleteAddress/:addressId", userController.addressdelete);

//-----------------------------FORGOTPASSWORD--------------------------------------------------

userRouter.post("/forgotPassword", auth.isLogin, userController.forgotPassword);
userRouter.get("/forgotpassOtp", userController.forgotpassOtpPage);
userRouter.get("/forgotPage", userController.loadforgotPass);
userRouter.post("/forgotEmailInput", userController.forgotEmailInput);
userRouter.post("/verifyForgotOTP", userController.verifyForgotOTP);
userRouter.post("/addNewPassword", userController.addNewPassword);

//-----------------------------CART MANAGEMENT--------------------------------------------------

userRouter.get("/cart", auth.isLogin, userController.loadCartPage);
userRouter.get("/addtoCart", auth.isLogin, userController.addToCart);
userRouter.post("/removeItem", userController.cartRemoveItem);
userRouter.get(
  "/updateQuantity/:id",
  auth.isLogin,
  userController.cartQuantityInc
);
userRouter.get(
  "/updateQuantityDec/:id",
  auth.isLogin,
  userController.cartQuantityDec
);

userRouter.put(
  "/updateQuantity/:id",
  auth.isLogin,
  userController.cartQuantityUpdate 
);
//------------------------------CHECKOUTPAGE-------------------------------------------------


userRouter.get("/checkout", auth.isLogin, userController.loadCheckout);
userRouter.get(
  "/checkoutEditAddress/:addressId",
  auth.isLogin,
  userController.checkoutloadAddressEdit
);
userRouter.post(
  "/checkoutEditingAddress/:addressId",
  auth.isLogin,
  userController.checkoutEditingAddress
);
userRouter.get(
  "/checkoutAddaddress",
  auth.isLogin,
  userController.loadcheckoutAddaddress
);
userRouter.post(
  "/checkoutAddingAddress",
  auth.isLogin,
  userController.checkoutaddressAdding
);

//-----------------------------ORDER MANAGEMENT--------------------------------------------------

userRouter.get("/orders", auth.isLogin, userController.loadOrdersPage);
userRouter.post(
  "/cancelOrder/:orderId",
  auth.isLogin,
  userController.cancelOrder
);
userRouter.delete("/cancelItem/:orderId/:productId", userController.cancelItem);
userRouter.get(
  "/userOrderDetail",
  auth.isLogin,
  userController.loadUserOrderDetailsPage
);

//-----------------------------PLACE ORDER--------------------------------------------------

userRouter.post("/placeOrder", auth.isLogin, userController.placeOrder);
userRouter.post("/placeOrderRaz", auth.isLogin, userController.placeOrderRaz);


//-----------------------------SHOP PAGE AND SEARCH PRODUCTS----------------------------------

userRouter.get("/homeProduct", userController.loadhomeProduct);
userRouter.get("/searchProduct", userController.searchProduct);


//-----------------------------INVOICE--------------------------------------------------

userRouter.get("/invoice", auth.isLogin, userController.invoice);
userRouter.get(
  "/invoiceDownload",
  auth.isLogin,
  userController.invoiceDownload
);


//-----------------------------COUPON--------------------------------------------------
// userRouter.post("/validateCoupon", auth.isLogin, userController.validateCoupon);


//-----------------------------WALLET--------------------------------------------------

userRouter.post("/addWallet", auth.isLogin, userController.addWallet);
userRouter.post("/updatewallet", auth.isLogin, userController.updateWallet);


//-----------------------------REFFERAL--------------------------------------------------

userRouter.get("/getreferal", auth.isLogin, userController.getreferal);

//-----------------------------WISHLIST--------------------------------------------------


//-----------------------------LOGOUT--------------------------------------------------
userRouter.get("/logout", auth.isLogin, userController.userLogout);

module.exports = userRouter;
