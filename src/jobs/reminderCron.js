// src/jobs/reminderCron.js
const cron = require('node-cron');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { sendReminderEmail } = require('../utils/emailService');

const initReminderJob = () => {
  // Rulează în fiecare oră la fix (ex: 10:00, 11:00)
  // Sintaxa: minut ora zi luna zi-saptamana
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running Event Reminder Cron Job...');

    try {
      // 1. Calculăm fereastra de timp (următoarele 24h)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(tomorrow.getHours() + 24);

      // Căutăm evenimente care:
      // - Încep în mai puțin de 24h de acum (startAt <= tomorrow)
      // - Încep în viitor (startAt > now) - ca să nu luăm evenimente trecute
      // - Nu au reminderul trimis (reminderSent: false)
      const upcomingEvents = await Event.find({
        startAt: {
          $gt: now,
          $lte: tomorrow
        },
        reminderSent: false,
        status: 'PUBLISHED' // Doar cele publicate
      });

      if (upcomingEvents.length === 0) return;

      console.log(`Găsite ${upcomingEvents.length} evenimente pentru reminder.`);

      // 2. Procesăm fiecare eveniment
      for (const event of upcomingEvents) {
        // Găsim toți userii care au bilet la acest eveniment
        const tickets = await Ticket.find({ eventId: event._id, status: 'CONFIRMED' });

        console.log(`Trimitere reminder pentru "${event.title}" către ${tickets.length} participanți.`);

        // Trimitem mailurile (în paralel pentru viteză)
        const emailPromises = tickets.map(async (ticket) => {
          const user = await User.findById(ticket.userId);
          if (user) {
            return sendReminderEmail(user.email, user.fullName, event.title, event.startAt);
          }
        });

        await Promise.all(emailPromises);

        // 3. Marcăm evenimentul ca notificat (IDEMPOTENȚĂ)
        // Foarte important ca să nu trimitem mailuri duplicate ora următoare
        event.reminderSent = true;
        await event.save();
      }

    } catch (error) {
      console.error('Eroare în Cron Job:', error);
    }
  });
};

module.exports = initReminderJob;