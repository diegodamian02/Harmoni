const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);
const template = fs.readFileSync(
  path.join(__dirname, '../templates/launch-invite.html'), 'utf8'
);

async function sendLaunchInvite(toEmail) {
  return resend.emails.send({
    from: 'Harmoni <hello@harmoni.cc>',
    to: toEmail,
    reply_to: 'diegodamiango02@gmail.com',
    subject: '🎵 You are on the waitlist of something awesome!',
    html: template,
  });
}

module.exports = { sendLaunchInvite };