const Mailjet = require('node-mailjet');
const qrcode = require('qrcode');
require('dotenv').config();

// Configurare Mailjet API Client
const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET
);

const sendEmail = async (to, subject, html, attachments = []) => {
  // Verificam daca trimiterea de emailuri este activata in .env
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log('📧 Email sending is disabled. Would have sent to:', to);
    return;
  }

  // Separăm atașamentele inline (cele cu CID) de cele normale
  const inlinedAttachments = attachments.filter(att => att.cid).map(att => ({
    ContentType: "image/png",
    Filename: att.filename,
    ContentID: att.cid,
    Base64Content: att.path.includes('base64,') ? att.path.split('base64,')[1] : att.path
  }));

  const regularAttachments = attachments.filter(att => !att.cid).map(att => ({
    ContentType: "application/pdf", // Default, poate fi ajustat dacă e cazul
    Filename: att.filename,
    Base64Content: att.path.includes('base64,') ? att.path.split('base64,')[1] : att.path
  }));

  try {
    const request = mailjet
      .post("send", { 'version': 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_SENDER,
              Name: "Univent Team"
            },
            To: [
              {
                Email: to,
                Name: "" // Putem adăuga numele dacă îl avem disponibil în funcție
              }
            ],
            Subject: subject,
            HTMLPart: html,
            InlinedAttachments: inlinedAttachments.length > 0 ? inlinedAttachments : undefined,
            Attachments: regularAttachments.length > 0 ? regularAttachments : undefined
          }
        ]
      });

    const result = await request;
    console.log(`✅ Email trimis către: ${to}`);
  } catch (error) {
    console.error(`❌ Eroare la trimiterea emailului către ${to}:`, error.message);
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
      console.error('Error info:', error.response?.text);
    }
  }
};

const sendTicketEmail = async (toEmail, userName, eventTitle, eventDate, ticketId, qrCodeContent) => {
  const subject = `Biletul tău pentru: ${eventTitle}`;
  const qrDataUrl = await qrcode.toDataURL(qrCodeContent);
  
  // Pregătim atașamentul pentru API-ul Mailjet
  // Nota: 'path' aici conține string-ul base64 complet (data:image/png;base64,...)
  const qrAttachment = {
    filename: 'qrcode.png',
    path: qrDataUrl,
    cid: 'qrcode' // Marchează ca fiind inline
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