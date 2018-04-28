import User from '../user/user.model';
import * as Mailer from '../../components/mailer';

export default {
  /**
   * Handle failed invoice payment
   * @param  {Object} req The request
   * @param  {Object} res The respnse
   */
  'invoice.payment_failed': (event, res) => {
    User.findOne({
      'account.stripeCustomerId': event.data.object.customer
    })
    .then(user => {
      if(!user) {
        // We do not have user with such customer id
        return res.sendStatus(200);
      }
      user.account.frozen = true;
      return user.save()
      .then(() => {
        Mailer.send({
          to: user.email,
          subject: `FBDOX - Your most recent invoice (${event.data.object.id}) payment failed`,
          text: `Hi there,

  Unfortunately your most recent invoice payment was declined.
  This could be due to a change in your card number or your card expiring, cancelation of your credit card,
  or the bank not recognizing the payment and taking action to prevent it.

  Please update your payment information as soon as possible by logging in here: https://fbdox.at/profile`
        });
      })
      .then(res.sendStatus.bind(res, 200));
    })
    .catch(e => {
      console.error('HANDLER_ERROR:invoice.payment_failed', e);
      res.sendStatus(200);
    });
  },
  /**
   * Handle succeeded invoice payment
   * @param  {Object} req The request
   * @param  {Object} res The respnse
   */
  'invoice.payment_succeeded': (event, res) => {
    User.findOne({
      'account.stripeCustomerId': event.data.object.customer
    })
    .then(user => {
      if(!user) {
        // We do not have user with such customer id
        return res.sendStatus(200);
      }
      user.account.frozen = false;
      return user.save()
      .then(() => {
        Mailer.send({
          to: user.email,
          subject: `FBDOX - Your most recent invoice (${event.data.object.id}) payment succeeded`,
          text: `Hi there,

  Thank you for the most recent invoice payment.

  Payment history is available in here: https://fbdox.at/profile`
        });
      })
      .then(res.sendStatus.bind(res, 200));
    })
    .catch(e => {
      console.error('HANDLER_ERROR:invoice.payment_succeeded', e);
      res.sendStatus(200);
    });
  },
  /**
   * Handle failed order payment
   * @param  {Object} req The request
   * @param  {Object} res The respnse
   */
  'order.payment_failed': (event, res) => {
    User.findOne({
      'account.stripeCustomerId': event.data.object.customer
    })
    .then(user => {
      if(!user) {
        // We do not have user with such customer id
        return res.sendStatus(200);
      }
      user.account.frozen = true;
      return user.save()
      .then(() => {
        Mailer.send({
          to: user.email,
          subject: `FBDOX - Your most recent order (${event.data.object.id}) payment failed`,
          text: `Hi there,

  Unfortunately your most recent order payment was declined.
  This could be due to a change in your card number or your card expiring, cancelation of your credit card,
  or the bank not recognizing the payment and taking action to prevent it.

  Please update your payment information as soon as possible by logging in here: https://fbdox.at/profile`
        });
      })
      .then(res.sendStatus.bind(res, 200));
    })
    .catch(e => {
      console.error('HANDLER_ERROR:order.payment_failed', e);
      res.sendStatus(200);
    });
  }
};
