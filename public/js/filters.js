angular.module('mean.system')
  .filter('upperFirstLetter', function () {
    return function (input) {
      input = input || '';
      return input.charAt(0).toUpperCase() + input.slice(1);
    };
  })
  .filter('addFriends', function () {
    return function (input, friendsEmail) {
      if (friendsEmail.includes(input)) {
        return 'Unfriend';
      }
      return 'Addfriend';
    };
  });
