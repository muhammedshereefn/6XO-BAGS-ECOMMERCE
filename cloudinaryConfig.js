const cloudinary = require('cloudinary').v2;
// Set up Cloudinary configuration
cloudinary.config({
    cloud_name: "dqwa8e8nq",
    api_key: "596822331818852",
    api_secret: "q9nhnXky4iYLHiOxy2YXX2T9TtY",
  });
  
  module.exports = { cloudinary };