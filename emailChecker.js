const {google} = require('googleapis');
const nodemailer = require('nodemailer');

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const gmail = google.gmail({
  version: 'v1',
  auth: oAuth2Client,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_ADDRESS,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    accessToken: process.env.ACCESS_TOKEN,
  },
});

async function checkForNewEmails() {
  const res = await gmail.users.threads.list({
    userId: 'me',
  });

  const threads = res.data.threads.filter(thread => {
    return thread.messages.length === 1 || thread.messages[0].labelIds.includes('SENT');
  });

  for (const thread of threads) {
    const headers = thread.messages[0].payload.headers;
    const sender = headers.find(header => header.name === 'From').value;

    const hasReply = thread.messages.some(message => message.labelIds.includes('SENT'));

    if (!hasReply) {
      const message = {
        to: sender,
        subject: 'Out of Office Auto-Reply',
        text: 'Thank you for your email. I am currently out of the office and will respond to your message upon my return.',
      };

      await sendEmail(message);

      await gmail.users.threads.modify({
        userId: 'me',
        id: thread.id,
        resource: {
          addLabelIds: ['Out of Office'],
        },
      });
    }
  }
}

async function sendEmail(message) {
  await transporter.sendMail(message);
}

module.exports = {checkForNewEmails};
