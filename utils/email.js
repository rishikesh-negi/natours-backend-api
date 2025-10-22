const nodemailer = require("nodemailer");

const sendEmail = async function (options) {
  // NOTE: Activate the "less secure app" option in Gmail account to use Gmail with Nodemailer. Although, Gmail is not an ideal emailing service for a production app as it only allows sending 500 emails per day, and it tends to mark accounts with many daily outgoing emails as "spammer". Send Grid and Mail Gun are ideal services for use in production, with Nodemailer.

  // 1) Create a transporter (the service to be used to send the email):
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options:
  const mailOptions = {
    from: "Rishikesh Negi <hello@rishi.io>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: // To be implemented later
  };

  // 3) Send the email using Nodemailer:
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
