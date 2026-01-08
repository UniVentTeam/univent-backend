# Arhitectura Tehnologică - UniVent Backend

Acest document descrie tehnologiile cheie și arhitectura backend-ului pentru aplicația UniVent.

## Tehnologii Principale

- **Platforma:** [Node.js](https://nodejs.org/) - Mediu de execuție pentru JavaScript.
- **Limbaj de Programare:** JavaScript
- **Framework Web:** [Express.js](https://expressjs.com/) - Framework minimalist pentru API-uri RESTful în Node.js.
- **Baza de Date:** [MongoDB](https://www.mongodb.com/) - Bază de date NoSQL orientată pe documente.
- **ODM (Object Data Modeling):** [Mongoose](https://mongoosejs.com/) - Librărie pentru modelarea datelor din MongoDB.

## Autentificare și Securitate

- **Strategie de autentificare:** [JSON Web Tokens (JWT)](https://jwt.io/) - Standard pentru transmiterea securizată a informațiilor între părți, folosit la securizarea API-ului.
- **Criptarea parolelor:** [bcryptjs](https://www.npmjs.com/package/bcryptjs) - Librărie pentru hash-uirea parolelor.

## Middleware și Utilitare

- **Variabile de mediu:** [dotenv](https://www.npmjs.com/package/dotenv) - Încarcă variabilele de mediu din fișiere `.env`.
- **Logging:** [Morgan](https://www.npmjs.com/package/morgan) - Middleware pentru logarea cererilor HTTP.
- **CORS:** [cors](https://www.npmjs.com/package/cors) - Middleware pentru activarea Cross-Origin Resource Sharing.
- **Generare PDF:** [PDFKit](http://pdfkit.org/) - Librărie pentru generarea de documente PDF.
- **Conversie JSON la CSV:** [json2csv](https://www.npmjs.com/package/json2csv) - Utilitar pentru conversia datelor din format JSON în CSV.

## Utilitare de Dezvoltare

- **Reîncărcare automată:** [Nodemon](https://nodemon.io/) - Monitorizează fișierele și restartează automat serverul la modificări.
