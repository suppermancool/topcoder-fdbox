import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';

function localAuthenticate(User, email, password, done) {
  User.findOne({ email: email.toLowerCase()})
    .exec()
    .then(user => {
      if(!user) {
        return done(null, false, {
          code: 'unauthorized',
          message: 'Invalid username or password.'
        });
      }
      if(user.account.frozen) {
        return done(null, false, {
          code: 'unauthorized',
          message: 'Your account is currently frozen.'
        });
      }

      user.authenticate(password, (authError, authenticated) => {
        if(authError) {
          return done(authError);
        }
        if(!authenticated) {
          return done(null, false, {
            code: 'unauthorized',
            message: 'Invalid username or password.'
          });
        } else {
          return done(null, user);
        }
      });
    })
    .catch(err => done(err));
}

export function setup(User/*, config*/) {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password' // this is the virtual field on the model
  }, (email, password, done) => localAuthenticate(User, email, password, done)));
}
