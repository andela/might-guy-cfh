angular.module('mean.system')
  .controller('GameTourController', ['$scope', '$window', function($scope, $window) {
    $scope.$on('$locationChangeSuccess', () => {
      if ($scope.gameTour) {
        $scope.gameTour.exit();
      }
    });

    $scope.gameTour = introJs();
    $scope.playerCount = 1;
    $scope.playerScore = 0;
    $scope.awaitingPlayers = true;
    $scope.gameTour.setOption('showBullets', true);
    $scope.gameTour.setOptions({
      steps: [{
          intro: `Welcome to Cards for Humanity, Here's a brief tour to help you get started.
          Use the arrow keys for navigation or hit ESC to proceed to playing the game.`
        },
        {
          element: '#finding-players',
          intro: `Game needs a minimum of 3 players to start.
          You have to wait for the minimum number of players to join the game.`
        },
        {
          element: '#player-container',
          intro: `This is you, that icon to help you identify yourself amongst
         other players.`
        },
        {
          element: '#start-game-button',
          intro: `Once the minimum required players have joined, you or any other user
         can start the game by clicking on the start game button.`
        },
        {
          element: '#question',
          intro: 'Once a game is started, a question is displayed.'
        },
        {
          element: '#cards',
          intro: `You also have different answer cards to pick what you deem
         the most appropriate answer to the question.`,
          position: 'top'
        },
        {
          element: '#inner-timer-container',
          intro: `Choose an answer
          to the current question. After time out, CZAR then select a favorite answer. whoever submitted
          CZARs favorite answer wins the round.`
        },
        {
          element: '#the-czar',
          intro: `Check the CZAR icon to 
          know the next CZAR. As a Czar, you wait for all players to
          submit their answers after which you select your favorite answer`
        },
        {
          element: '#inner-text-container',
          intro: `After a game ends, you can join a new a game or return to Lobby`,
          position: 'top'
        },
        {
          element: '#charity-widget-container',
          intro: `Click here to donate to charity at the end of the game.`,
          position: 'top'
        },
        {
          element: '#abandon-game-button',
          intro: 'You can click this icon to abandon a game at any time.'
        },
        {
          element: '#home',
          intro: 'Wow!!! Tour Completed Successfully',
          position: 'bottom'
        }

      ]
    });

    const isGameCustom = () => {
      const custom = $window.location.href.indexOf('custom') >= 0;
      return (custom);
    };

    const tourComplete = () => {
      if (isGameCustom()) {
        $window.location = '/play?custom';
      } else {
        $window.location = '/play';
      }
    };

    const beforeTourChange = (targetElement) => {
      switch (targetElement.id) {
        case 'finding-players':
          {
            $scope.$apply(() => {
              $scope.awaitingPlayers = true;
            });
            break;
          }
        case 'player-container':
          {
            $scope.$apply(() => {
              $scope.awaitingPlayers = true;
              $scope.showOtherPlayers = true;
              $scope.showStartButton = false;
            });
            break;
          }
        case 'player-score':
          {
            $scope.$apply(() => {
              $scope.awaitingPlayers = true;
              $scope.showOtherPlayers = true;
              $scope.showStartButton = false;
            });
            break;
          }
        case 'start-game-button':
          {
            $scope.$apply(() => {
              $scope.awaitingPlayers = false;
              $scope.showOtherPlayers = true;
              $scope.showStartButton = true;
              $scope.showTime = false;
              $scope.showQuestion = false;
            });
            break;
          }
        case 'question':
          {
            $scope.$apply(() => {
              $scope.showStartButton = false;
              $scope.showTime = true;
              $scope.showQuestion = true;
            });
            break;
          }
        case 'cards':
          {
            $scope.$apply(() => {
              $scope.showCzar = false;
            });
            break;
          }
        case 'time-card':
          {
            $scope.$apply(() => {
              $scope.showQuestion = true;
              $scope.gameEnd = false;
              $scope.playerScore = 0;
            });
            break;
          }
        case 'the-czar':
          {
            $scope.$apply(() => {
              $scope.showCzar = true;
              $scope.playerScore = 1;
            });
            break;
          }
        case 'inner-text-container':
          {
            $scope.$apply(() => {
              $scope.showQuestion = false;
              $scope.gameEnd = true;
              $scope.showChatBody = false;
            });
            break;
          }
        case 'chat':
          {
            $scope.$apply(() => {
              $scope.showChatBody = true;
            });
            break;
          }
        case 'requests':
          {
            $scope.$apply(() => {
              $scope.showChatBody = false;
            });
            break;
          }
        default:
          {

          }
      }
    };

    $scope.gameTour.start()
      .oncomplete(tourComplete)
      .onexit(tourComplete)
      .onbeforechange(beforeTourChange);
  }]);