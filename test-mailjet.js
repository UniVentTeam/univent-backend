// test-mailjet.js
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('--- TESTARE CONFIGURARE EMAIL ---');
console.log('EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
console.log('EMAIL_SENDER:', process.env.EMAIL_SENDER);
console.log('API KEY (primele 5 caractere):', process.env.MAILJET_API_KEY ? process.env.MAILJET_API_KEY.substring(0, 5) + '...' : 'LIPSA');
console.log('API SECRET (setat):', process.env.MAILJET_API_SECRET ? 'DA' : 'NU');

const transporter = nodemailer.createTransport({
  host: "in-v3.mailjet.com",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.MAILJET_API_KEY,
    pass: process.env.MAILJET_API_SECRET
  }
});

async function runTest() {
  try {
    console.log('\n⏳ Încercăm să trimitem un email de test...');
    
    // Folosim o adresă temporară sau chiar pe cea de sender ca destinatar pentru test
    const testRecipient = process.env.EMAIL_SENDER; 

    const info = await transporter.sendMail({
      from: `"Test Univent" <${process.env.EMAIL_SENDER}>`,
      to: testRecipient,
      subject: "Test Configurare Mailjet - Univent",
      text: "Dacă citești acest mesaj, configurarea Mailjet funcționează corect!",
      html: "<h3>Succes! 🎉</h3><p>Configurarea Mailjet este corectă.</p>"
    });

    console.log('✅ Email trimis cu succes!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('❌ EROARE CRITICĂ:');
    console.error(error);
    
    if (error.responseCode === 401) {
      console.log('\n👉 Sfat: Verifică API KEY și API SECRET în .env');
    } else if (error.responseCode === 403 || (error.response && error.response.includes('Sender'))) {
      console.log('\n👉 Sfat: Adresa din EMAIL_SENDER nu este validată în Mailjet.');
    }
  }
}

runTest();
