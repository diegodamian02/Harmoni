const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWaitlistConfirmation(toEmail) {
  return resend.emails.send({
    from: 'Harmoni <hello@harmoni.cc>',
    to: toEmail,
    reply_to: 'diegodamiango02@gmail.com',
    subject: '🎵 You are on the waitlist of something awesome!',
    template_id: process.env.RESEND_TEMPLATE_ID,
  });
}

const sendLaunchInvite = sendWaitlistConfirmation;

module.exports = { sendLaunchInvite, sendWaitlistConfirmation };
