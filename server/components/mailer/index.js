'use strict';
import nodemailer from 'nodemailer';
import config from '../../config/environment';

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport(config.mailer);

export function send(mailOptions = {from: config.mail.defaults.from, subject: config.mail.defaults.subject}) {
  return new Promise((resolve, reject) => {
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) =>
      error ? reject(error) : resolve(info));
  });
}
