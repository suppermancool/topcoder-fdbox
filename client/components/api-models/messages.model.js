'use strict';

export function MessagesResource($resource) {
  'ngInject';


  let messages = $resource('/api/messages/:id/:controller', {
    id: '@id'
  }, {
    update: {method: 'PUT'},
    create: {method: 'POST'},
    query: {method: 'GET', isArray: false},
  });

  messages.prototype.$save = function() {
    return this[this.id ? '$update' : '$create']();
  };

  return messages;
}
