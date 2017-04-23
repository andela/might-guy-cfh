
angular.module('mean.system')
  .controller('IndexController',
  [
    '$scope',
    'Global',
    '$location',
    '$http',
    '$window',
    'socket',
    'game',
    'AvatarService',
    (
      $scope,
      Global,
      $location,
      $http,
      $window,
      socket,
      game,
      AvatarService) => {
      $scope.global = Global;
      $scope.formData = {};

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
        $scope.showMessage = '';
        $http.post('/api/auth/signup', JSON.stringify($scope.formData))
          .success((data) => {
            if (data.success === true) {
              $window.localStorage.setItem('user-token', data.token);
              $window.location.href = '/gametour';
            } else {
              $scope.showMessage = data.message;
              angular.element(document.querySelector('#name')).val('');
              angular.element(document.querySelector('#email')).val('');
              angular.element(document.querySelector('#password')).val('');
            }
          }).error((error, status) => {
            $scope.showMessage = `${status} : ${error}`;
            angular.element(document.querySelector('#name')).val('');
            angular.element(document.querySelector('#email')).val('');
            angular.element(document.querySelector('#password')).val('');
          });
      };

      $scope.signIn = () => {
        $scope.showMessage = '';
        $http.post('/api/auth/signin', JSON.stringify($scope.formData))
          .success((data) => {
            if (data.success === true) {
              $window.localStorage.setItem('user-token', data.token);
              $window.location.href = '/';
            } else {
              $scope.showMessage = data.message;
              angular.element(document.querySelector('#email')).val('');
              angular.element(document.querySelector('#password')).val('');
            }
          }).error((error, status) => {
            $scope.showMessage = `${status} : ${error}`;
            angular.element(document.querySelector('#email')).val('');
            angular.element(document.querySelector('#password')).val('');
          });
      };
      if (window.user !== null) {
        if (window.user._id !== null) {
          $scope.LoadNotifications = () => {
            const userId = window.user._id;
            $http.post('/api/notify', { user_id: userId })
              .success((response) => {
                $scope.allNotification = response;
                $scope.count = $scope.allNotification.length;
                console.log(response);
              }, (error) => {
                console.log(error);
              }
              );
          };

          $scope.readNotifications = (notifyId) => {
            const userId = window.user._id;
            $http.post('/api/read', { user_id: userId, notifyId })
              .success((response) => {
                if (response.succ) {
                  $scope.LoadNotifications();
                }
              }, (error) => {
                console.log(error);
              }
              );
          };
          $scope.LoadNotifications();
        }
      }
      // console.log(window);
      $scope.avatars = [];
      AvatarService.getAvatars()
        .then((data) => {
          $scope.avatars = data;
        });
    }]);
