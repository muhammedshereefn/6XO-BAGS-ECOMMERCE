const nodemailer = require("nodemailer");
require("dotenv").config();
const randomString = require("randomstring");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "muhammedshereefshaz@gmail.com",
    pass: "xgcv qigy kjwz ivjr",
  },
});

function sendPasswordResetLink(email) {
  // Generate a unique token for password reset
  const resetToken = randomString.generate({
    length: 32,
    charset: "alphanumeric",
  });

  // Include the reset token in the password reset link
  const resetLink = `http://yourwebsite.com/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: "muhammedshereefshaz@gmail.com",
    to: email,
    subject: "Password Reset",
    html: `
      <p>Hello,</p>
      <p>You have requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  // Return the reset token so it can be stored in your system
  return resetToken;
}

module.exports = { sendPasswordResetLink };
