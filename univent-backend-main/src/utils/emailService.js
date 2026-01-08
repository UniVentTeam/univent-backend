// src/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",  // Specificăm explicit serverul Google
  port: 465,               // Folosind portul 465 (SSL) este adesea mai sigur și trece de firewall-uri
  secure: true,            // true pentru portul 465, false pentru alte porturi
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Trimite email de confirmare bilet
 */
const sendTicketEmail = async (toEmail, userName, eventTitle, eventDate, ticketId) => {
  try {
    const mailOptions = {
      from: `"Univent Team" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Biletul tău pentru: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #4CAF50;">Salut, ${userName}!</h2>
          <p>Înregistrarea ta la evenimentul <strong>${eventTitle}</strong> a fost confirmată.</p>
          <p><strong>📅 Data:</strong> ${new Date(eventDate).toLocaleString('ro-RO')}</p>
          <p><strong>🎟️ ID Bilet:</strong> ${ticketId}</p>
          <hr>
          <p>Te așteptăm cu drag!</p>
          <small>Echipa Univent</small>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    // console.log(`📧 Email trimis cu succes către ${toEmail}`);
  } catch (error) {
    console.error("❌ Eroare la trimiterea emailului:", error);
    // Nu aruncăm eroare (throw) pentru a nu bloca răspunsul către client dacă pică serverul de mail
  }
};

module.exports = { sendTicketEmail };