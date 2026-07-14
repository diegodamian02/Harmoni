const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendWaitlistConfirmation(toEmail) {
  await transporter.sendMail({
    from: `"Harmoni" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "You're on the Harmoni waitlist 🎵",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background:#212121;font-family:'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#212121;padding:48px 24px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width:520px;">
                  <tr>
                    <td style="padding-bottom:32px;">
                      <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:-0.04em;
                        background:linear-gradient(135deg,#ff69b4,#73105a);
                        -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                        background-clip:text;">harmoni</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:24px;">
                      <h1 style="margin:0;font-size:36px;font-weight:600;color:#f5f5f5;
                        letter-spacing:-0.04em;line-height:1.1;">
                        You're on the list.
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:40px;">
                      <p style="margin:0;font-size:16px;line-height:1.7;color:#888888;">
                        Thanks for joining — you're one of the first people to believe in Harmoni.
                        We're building something for people who think music reveals more than any
                        personality quiz ever could.
                      </p>
                      <p style="margin:16px 0 0;font-size:16px;line-height:1.7;color:#888888;">
                        We'll reach out when the app is ready. In the meantime, tell a friend
                        who'd get it.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:32px;">
                      <p style="margin:0;font-size:13px;color:#555555;">
                        harmoni.cc · You're receiving this because you joined the waitlist.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

module.exports = { sendWaitlistConfirmation };
