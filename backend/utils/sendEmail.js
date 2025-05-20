const nodemailer = require("nodemailer");

/**
 * Send an email with optional attachments
 * @param {String} subject - Email subject
 * @param {String} message - Email HTML content
 * @param {String} send_to - Recipient email address
 * @param {String} sent_from - Sender email address
 * @param {String} reply_to - Reply-to email address
 * @param {Array} attachments - Optional array of attachment objects
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendEmail = async (subject, message, send_to, sent_from, reply_to, attachments = []) => {
  return new Promise((resolve, reject) => {
    //create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    //options for sending email
    const options = {
      from: sent_from,
      to: send_to,
      replyTo: reply_to,
      subject: subject,
      html: message,
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      options.attachments = attachments;
    }

    //send email
    transporter.sendMail(options, function (err, info) {
      if (err) {
        console.log("Email error:", err);
        reject(err);
      } else {
        console.log("Email sent:", info);
        resolve(info);
      }
    });
  });
};

module.exports = sendEmail;
