'use strict';

export function UserResource($resource) {
  'ngInject';

  return $resource('/api/users/:id/:controller', {
    id: '@id'
  }, {
    query: {method: 'GET', isArray: false},
    changePassword: {
      method: 'PUT',
      params: {
        controller: 'password'
      }
    },
    get: {
      method: 'GET',
      params: {
        id: 'me'
      }
    },
    getMembers: {
      method: 'GET',
      params: {
        controller: 'members'
      }
    },
    updateMe: {
      method: 'PUT',
      params: {
        id: 'me'
      }
    },
    update: {
      method: 'PUT'
    }
  });
}
