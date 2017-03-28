
angular.module('mean.system')
.factory('LS', ['$rootScope', '$window', ($window, $rootScope) => {
  angular.element($window).on('storage', (event) => {
    if (event.key === 'token-storage') {
      $rootScope.$apply();
    }
  });
  return {
    setData: (val) => {
        console.log($window.localStorage);
      //$window.localStorage && $window.localStorage.setItem('my-storage', val);
    //   $window.localStorage && $window.localStorage.setItem('token-storage', val);
      return this;
    },
    getData: () => {
      return $window.localStorage && $window.localStorage.getItem('token-storage');
    }
  };
}]);