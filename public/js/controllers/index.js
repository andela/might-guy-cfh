
angular.module('mean.system')
.controller('IndexController',
  [
    '$scope',
    '$http',
    'Global',
    '$location',
    'socket',
    'game',
    'AvatarService',
    '$window',
    ($scope, $http, Global, $location, socket, game,
  AvatarService, $window) => {
      $scope.global = Global;
      $scope.formData = {};
      $scope.showDialog = false;
      $scope.dialogMessage = '';

      $scope.playAsGuest = () => {
        game.joinGame();
        $location.path('/app');
      };

      $scope.showError = () => {
        if ($location.search().error) {
          return $location.search().error;
        }
        return false;
      };

      $scope.signUp = () => {
        $http.post('/api/auth/signup', $scope.formData)
      .success((data) => {
        if (data.success === true) {
          $window.localStorage.setItem('user-token', data.token);
          $window.location.href = '/';
        } else {
          // Show Login Failure Message
        }
      });
      };

      $scope.signIn = () => {
        $http.post('/api/auth/signin', $scope.formData)
        .success((data) => {
          if (data.success === false) {
            $window.localStorage.setItem('user-token', data.token);
            $window.location.href = '/';
          } else {
              // Failure Message here
          }
        });
      };

      $scope.avatars = [];
      AvatarService.getAvatars()
      .then((data) => {
        $scope.avatars = data;
      });
    }]);
