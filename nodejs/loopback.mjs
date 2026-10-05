// Docs: README.md. Run from nodejs/: node loopback.mjs
import nodemailer from 'nodemailer';
import { openSink } from './sink.mjs';
const sink = await openSink();
const smtp = nodemailer.createTransport({ host: '127.0.0.1', port: sink.port, ignoreTLS: true });
try {
  await smtp.sendMail({
    from: 'app@example.com', to: 'support@example.com', subject: 'Ticket 42 ✓',
    envelope: { from: 'bounce@example.com', to: ['ticket+42@example.com'] },
    text: 'Please inspect the attached log.',
    attachments: [{ filename: 'log.txt', content: 'status=ok\n' }],
  });
  const { mail, recipients } = sink.records[0];
  console.log(JSON.stringify({ recipients, headerTo: mail.to.text, subject: mail.subject,
    attachment: mail.attachments[0].content.toString() }, null, 2));
} finally { smtp.close(); await sink.close(); }
