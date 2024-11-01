const nodemailer = require("nodemailer");
require("dotenv").config();
const randomString = require("randomstring");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function sendOtp(email) {
  const otp = randomString.generate({
    length: 6,
    charset: "numeric",
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "OTP FROM 6XO BAGS",
    text: `YOUR OTP : ${otp} `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
  return otp;
}

module.exports = { sendOtp };
