'use strict';

export default class LoginController {
  user = {
    name: '',
    email: '',
    password: ''
  };
  errors = {
    login: undefined
  };
  submitted = false;


  /*@ngInject*/
  constructor(Auth, $location) {
    this.Auth = Auth;
    this.$location = $location;
  }

  login(form) {
    this.submitted = true;

    if(form.$valid) {
      this.Auth.login({
        email: this.user.email,
        password: this.user.password
      })
        .then(() => {
          let isAdmin = this.Auth.hasRoleSync('admin');
          // Logged in, redirect to home
          this.$location.path(isAdmin ? '/admin' : '/settings');
        })
        .catch(err => {
          this.errors.login = err.message;
        });
    }
  }
}
