// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, "./public/products/");
//   },
//   filename: function (req, file, callback) {
//     let filename =
//       file.originalname + "-" + Date.now() + path.extname(file.originalname);

//     if (!req.session.images) {
//       req.session.images = [];
//     }

//     req.session.images.push(filename);
//     // console.log(req.session.images);

//     callback(null, filename);
//   },
// });

// const upload = multer({ storage: storage });

// module.exports = { upload };





const multer = require("multer");
const { cloudinary } = require("../cloudinaryConfig");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products", // The folder name in Cloudinary
    allowed_formats: ["jpeg", "png", "jpg"], // Allowed file types
  },
});

// Set up multer with Cloudinary storage
const upload = multer({ storage });

module.exports = { upload };
