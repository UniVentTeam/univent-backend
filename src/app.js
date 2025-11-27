const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const associationRoutes = require('./routes/associationRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const checkInRoutes = require('./routes/checkInRoutes');
const systemRoutes = require('./routes/systemRoutes');




const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("UniVent API is running...");
});
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/associations', associationRoutes);
app.use('/events', eventRoutes);
app.use('/tickets', ticketRoutes);
app.use('/check-in', checkInRoutes);
app.use('/system', systemRoutes);



module.exports = app;
