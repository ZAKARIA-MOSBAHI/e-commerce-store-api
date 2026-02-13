const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

/**
 * Sends an order confirmation email to the user
 *
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.name
 * @param {string} params.orderId
 */
async function sendOrderConfirmationEmail({ to, name, orderId }) {
  try {
    console.log("----------------------------------");
    console.log(process.env.MAIL_USER);
    console.log("----------------------------------");
    console.log(process.env.GOOGLE_APP_PASSWORD);
    const mailOptions = {
      from: `"Luxeweave Store" <${process.env.MAIL_USER}>`,
      to,
      subject: `Order #${orderId} Confirmation`,
      html: buildOrderEmailTemplate({ name, orderId }),
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email error:", error.message);
    return {
      success: false,
      message: "Failed to send order confirmation email",
    };
  }
}

/**
 * Extract template logic for cleaner separation
 */
function buildOrderEmailTemplate({ name, orderId }) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Thank You for Your Order, ${name}!</h2>
      <p>Your order has been successfully placed.</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p>We'll notify you once your order is shipped.</p>
      <hr />
      <small>This is an automated message. Please do not reply.</small>
    </div>
  `;
}

module.exports = { sendOrderConfirmationEmail };
