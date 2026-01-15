const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
require('dotenv').config();

// Configurare Mailjet SMTP
const transporter = nodemailer.createTransport({
  host: "in-v3.mailjet.com",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: process.env.MAILJET_API_KEY,
    pass: process.env.MAILJET_API_SECRET
  }
});

const sendEmail = async (to, subject, html, attachments = []) => {
  // Verificam daca trimiterea de emailuri este activata in .env
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log('📧 Email sending is disabled. Would have sent to:', to);
    return;
  }

  try {
    const mailOptions = {
      from: `"Univent Team" <${process.env.EMAIL_SENDER}>`, // Adresa verificată în Mailjet
      to,
      subject,
      html,
      attachments
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email trimis către: ${to}`);
  } catch (error) {
    console.error(`❌ Eroare la trimiterea emailului către ${to}:`, error);
    // Logăm eroarea completă pentru debug
    if (error.response) {
      console.error(error.response);
    }
  }
};

const sendTicketEmail = async (toEmail, userName, eventTitle, eventDate, ticketId, qrCodeContent) => {
  const subject = `Biletul tău pentru: ${eventTitle}`;
  const qrDataUrl = await qrcode.toDataURL(qrCodeContent);
  const qrAttachment = {
    filename: 'qrcode.png',
    path: qrDataUrl,
    cid: 'qrcode'
  };

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #4CAF50;">Salut, ${userName}!</h2>
      <p>Înregistrarea ta la evenimentul <strong>${eventTitle}</strong> a fost confirmată.</p>
      <p><strong>📅 Data:</strong> ${new Date(eventDate).toLocaleString('ro-RO')}</p>
      <p><strong>🎟️ ID Bilet:</strong> ${ticketId}</p>
      <p>Prezintă acest cod QR la intrare:</p>
      <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px;"/>
      <hr>
      <p>Te așteptăm cu drag!</p>
      <small>Echipa Univent</small>
    </div>
  `;
  await sendEmail(toEmail, subject, html, [qrAttachment]);
};

const sendNewOrganizerRequest = async (adminEmails, user) => {
  const subject = `Cerere nouă pentru rolul de Organizator`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #007bff;">Cerere nouă de la ${user.fullName}</h2>
      <p>Utilizatorul <strong>${user.fullName}</strong> (${user.email}) a solicitat rolul de Organizator.</p>
      <p>Poți modifica rolul acestui utilizator din panoul de administrare.</p>
      <hr>
      <small>Echipa Univent</small>
    </div>
  `;
  await sendEmail(adminEmails, subject, html);
};

const sendOrganizerRequestWithAssociation = async (adminEmails, user, associationName) => {
  const subject = `Cerere nouă: Organizator pentru ${associationName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #007bff;">Cerere nouă de la ${user.fullName}</h2>
      <p>Utilizatorul <strong>${user.fullName}</strong> (${user.email}) dorește să devină organizator pentru asociația <strong>${associationName}</strong>.</p>
      <p>Verifică detaliile și actualizează rolul/permisiunile din panoul de administrare.</p>
      <hr>
      <small>Echipa Univent</small>
    </div>
  `;
  await sendEmail(adminEmails, subject, html);
};

const sendEventStatusUpdate = async (organizerEmails, event, status, rejectionReason = null) => {
  const isApproved = status === 'PUBLISHED';
  const subject = `Statusul evenimentului "${event.title}" a fost actualizat`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: ${isApproved ? '#4CAF50' : '#dc3545'};">Evenimentul tău a fost ${isApproved ? 'Aprobat' : 'Respins'}</h2>
      <p>Evenimentul: <strong>${event.title}</strong></p>
      ${rejectionReason ? `<p><strong>Motivul respingerii:</strong> ${rejectionReason}</p>` : ''}
      <hr>
      <small>Echipa Univent</small>
    </div>
  `;
  await sendEmail(organizerEmails, subject, html);
};

const sendEventPendingEmail = async (adminEmails, event, organizerName) => {
  const subject = `Eveniment nou în așteptare de la ${organizerName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #ffc107;">Eveniment nou în așteptare</h2>
      <p>Organizatorul <strong>${organizerName}</strong> a creat sau actualizat evenimentul <strong>"${event.title}"</strong>.</p>
      <p>Acesta așteaptă aprobarea ta în panoul de administrare.</p>
      <hr>
      <small>Echipa Univent</small>
    </div>
  `;
  await sendEmail(adminEmails, subject, html);
};

const sendReminderEmail = async (toEmail, userName, eventName, eventDate) => {
  const subject = `🔔 Reminder: Mâine are loc ${eventName}!`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h3>Salut, ${userName}!</h3>
      <p>Îți reamintim că evenimentul <strong>${eventName}</strong> începe mâine.</p>
      <p>📅 Data: ${new Date(eventDate).toLocaleString('ro-RO')}</p>
      <p>Te rugăm să ai biletul (QR Code) pregătit la intrare.</p>
      <br>
      <small>Echipa Univent</small>
    </div>
  `;
  // Folosim sendEmail pentru a beneficia de verificarea EMAIL_ENABLED si error handling centralizat
  await sendEmail(toEmail, subject, html);
};

module.exports = { 
  sendTicketEmail,
  sendNewOrganizerRequest,
  sendEventStatusUpdate,
  sendEventPendingEmail,
  sendReminderEmail,
  sendOrganizerRequestWithAssociation
};