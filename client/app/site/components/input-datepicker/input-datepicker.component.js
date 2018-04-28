'use strict';

import angular from 'angular';
import moment from 'moment';

export class InputDatepickerComponent {
  constructor() {
    this.defaultDatePickerOptions = {
      showWeeks: false,
      formatDay: 'd',
      formatMonth: 'MMMM',
      formatDayHeader: 'EEE'
    };
    this.dateFormat = ['DD.MM.YYYY', 'D.M.YYYY'];
    this.focusGroupIfExists = false;
  }

  isDateOverlayOpened() {
    return this.dateOverlayOpened || false;
  }

  openDateOverlay() {
    this.dateOverlayOpened = true;
  }

  keyPressed($event) {
    if($event.keyCode == 40) {
      $event.preventDefault();
      this.dateOverlayOpened = true;
    }

    let allowedChars = '0123456789.';
    if($event.key.length === 1 && allowedChars.indexOf($event.key) === -1) {
      $event.preventDefault();
    }
  }

  closeDateOverlay() {
    this.dateOverlayOpened = false;
  }

  inputInFocus() {
    this.focusGroupIfExists = true;
  }

  inputBlurred() {
    this.focusGroupIfExists = false;
  }
}

export default angular.module('fbdoxApp.interviewTypes.inputDatepicker', [])
  .component('inputDatepicker', {
    template: require('./input-datepicker.html'),
    controller: InputDatepickerComponent,
    bindings: {
      label: '@',
      tooltip: '@',
      name: '@',
      model: '='
    }
  })
  .directive('dateFormat', () => ({
    require: 'ngModel',
    scope: {
      format: '='
    },
    link: (scope, element, attrs, ngModelController) => {
      ngModelController.$parsers.unshift(viewValue => {
        let date = moment.utc(viewValue, scope.format, true);
        if(date && date.isValid() && date.year() > 1899) {
          ngModelController.$setValidity('datePick', true);
          return date.toDate();
        } else {
          ngModelController.$setValidity('datePick', false);
          return undefined;
        }
      });
      ngModelController.$formatters.unshift(modelValue => {
        if(!scope.format || !modelValue) return '';
        let retVal = moment.utc(new Date(modelValue)).format(scope.format[0]);
        ngModelController.$setValidity('datePick', true);
        return retVal;
      });
    }
  }))
  .name;
