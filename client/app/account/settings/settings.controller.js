'use strict';

export default class SettingsController {
  user = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  errors = {
    other: undefined
  };
  message = '';
  submitted = false;


  /*@ngInject*/
  constructor(Auth) {
    this.Auth = Auth;
    this.getCurrentUser = Auth.getCurrentUserSync;
  }

  changePassword(form) {
    this.submitted = true;

    if(form.$valid) {
      this.Auth.changePassword(this.user.oldPassword, this.user.newPassword)
        .then(() => {
          this.message = 'Password successfully changed.';
        })
        .catch(() => {
          form.password.$setValidity('mongoose', false);
          this.errors.other = 'Incorrect password';
          this.message = '';
        });
    }
  }
}
