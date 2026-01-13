require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const initReminderJob = require('./jobs/reminderCron'); // Importă jobul

const PORT = process.env.PORT || 4000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);

    initReminderJob();
    console.log('📅 Event Reminder Service started.');
  });
}

startServer();
