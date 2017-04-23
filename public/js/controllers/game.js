angular.module('mean.system')
  .controller('GameController', ['$scope', 'game',
    '$timeout', '$location', 'MakeAWishFactsService', '$dialog', '$http', 'socket',
    ($scope, game, $timeout, $location,
      MakeAWishFactsService, $dialog, $http, socket) => {
      $scope.hasPickedCards = false;
      $scope.winningCardPicked = false;
      $scope.showTable = false;
      $scope.modalShown = false;
      $scope.game = game;
      $scope.pickedCards = [];
      $scope.friendList = [];
      let makeAWishFacts = MakeAWishFactsService.getMakeAWishFacts();
      $scope.makeAWishFact = makeAWishFacts.pop();

      $scope.pickCard = function (card) {
        if (!$scope.hasPickedCards) {
          if ($scope.pickedCards.indexOf(card.id) < 0) {
            $scope.pickedCards.push(card.id);
            if (game.curQuestion.numAnswers === 1) {
              $scope.sendPickedCards();
              $scope.hasPickedCards = true;
            } else if (game.curQuestion.numAnswers === 2 &&
              $scope.pickedCards.length === 2) {
              // delay and send
              $scope.hasPickedCards = true;
              $timeout($scope.sendPickedCards, 300);
            }
          } else {
            $scope.pickedCards.pop();
          }
        }
      };

      $scope.pointerCursorStyle = function () {
        if ($scope.isCzar() && $scope.game.state === 'waiting for czar to decide') {
          return { cursor: 'pointer' };
        }
        return {};
      };

      $scope.sendPickedCards = function () {
        game.pickCards($scope.pickedCards);
        $scope.showTable = true;
      };

      $scope.cardIsFirstSelected = function (card) {
        if (game.curQuestion.numAnswers > 1) {
          return card === $scope.pickedCards[0];
        }
        return false;
      };

      $scope.cardIsSecondSelected = function (card) {
        if (game.curQuestion.numAnswers > 1) {
          return card === $scope.pickedCards[1];
        }
        return false;
      };

      $scope.firstAnswer = function ($index) {
        if ($index % 2 === 0 && game.curQuestion.numAnswers > 1) {
          return true;
        }
        return false;
      };

      $scope.secondAnswer = function ($index) {
        if ($index % 2 === 1 && game.curQuestion.numAnswers > 1) {
          return true;
        }
        return false;
      };

      $scope.showFirst = function (card) {
        return game.curQuestion.numAnswers > 1 && $scope.pickedCards[0] === card.id;
      };

      $scope.showSecond = function (card) {
        return game.curQuestion.numAnswers > 1 && $scope.pickedCards[1] === card.id;
      };

      $scope.isCzar = function () {
        return game.czar === game.playerIndex;
      };

      $scope.isPlayer = function ($index) {
        return $index === game.playerIndex;
      };

      $scope.isCustomGame = function () {
        return !(/^\d+$/).test(game.gameID) && game.state === 'awaiting players';
      };

      $scope.isPremium = function ($index) {
        return game.players[$index].premium;
      };

      $scope.currentCzar = function ($index) {
        return $index === game.czar;
      };

      $scope.winningColor = function ($index) {
        if (game.winningCardPlayer !== -1 && $index === game.winningCard) {
          return $scope.colors[game.players[game.winningCardPlayer].color];
        }
        return '#f9f9f9';
      };

      $scope.pickWinning = function (winningSet) {
        if ($scope.isCzar()) {
          game.pickWinning(winningSet.card[0]);
          $scope.winningCardPicked = true;
        }
      };

      $scope.winnerPicked = function () {
        return game.winningCard !== -1;
      };

      const displayMessage = (message, modalID) => {
        $scope.message = message;
        $(modalID).modal();
      };

      $scope.joinName = name => name.split(' ').join('');

      $scope.getFriends = () => {
        const userId = window.user._id;
        $http.post('/api/friends', { user_id: userId })
          .success((response) => {
            $scope.userFriends = response;
          }, (error) => {
            console.log(error);
          }
          );
      };

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
      if (window.user !== null) {
        $scope.LoadNotifications();
      }
      $scope.addFriend = (friend, button) => {
        const friendId = friend._id;
        const userId = window.user._id;
        const url = button.target.baseURI;
        let checkButton;
        if ($scope.userFriends.includes(friendId)) {
          checkButton = 'Unfriend';
        } else {
          checkButton = 'Addfriend';
        }
        $http.post('/friends',
          {
            user_id: userId,
            checkButton,
            friendId,
            url
          })
          .success((response) => {
            if (response.succ) {
              setTimeout(() => {
                $scope.$apply(() => {
                  if (response.action === 'addfriend') {
                    const resultId = response.friendId;
                    $scope.userFriends.push(resultId);
                  } else {
                    const resultId = response.friendId;
                    const index = $scope.userFriends.indexOf(resultId);
                    if (index !== -1) {
                      $scope.userFriends.splice(index, 1);
                    }
                  }
                });
              }, 100);
            }
          });
      };
      $scope.sendNotification = (button) => {
        const friendList = $scope.userFriends;
        const url = button.target.baseURI;
        const userName = window.user.name;
        console.log(friendList);
        $http.post('/notify',
          {
            userName,
            friendList,
            url
          })
          .success((response) => {
            if (response.succ) {
              response.send('Notification sent Successfully');
            }
          });
      };
      $scope.invite = (user, button) => {
        $scope.invitedUsers = JSON.parse(sessionStorage.invitedUsers);
        if ($scope.invitedUsers.length === 10) {
          $('[data-toggle="popover"]').popover();
        }

        if ($scope.invitedUsers.length <= 10) {
          const inviteButton = document.getElementById(`${button.target.id}`);
          inviteButton.disabled = true;
          inviteButton.className.replace(/\binvite pull-right\b/, '');
          // if (inviteButton.class === 'invite')
          //   {$scope.class = 'invite';}
          // else {
          //   $scope.class = 'invite';
          // }
          if ($scope.invitedUsers.indexOf(user.name) === -1) {
            $scope.invitedUsers.push(user.name);
            sessionStorage.invitedUsers = JSON.stringify($scope.invitedUsers);
          }
        }

        const url = button.target.baseURI;
        const obj = {
          url,
          invitee: user.email,
          gameOwner: game.players[0].username
        };

        $http.post('/inviteusers', obj);
      };

      $scope.getUsers = () => {
        $http.get('/api/search/users')
          .success((response) => {
            $scope.currentUsers = response;
            displayMessage('', '#users-modal');
          }, error => error
          );
      };

      $scope.searchUsers = () => {
        if (!sessionStorage.invitedUsers) {
          sessionStorage.invitedUsers = JSON.stringify([]);
        }

        $scope.userMatches = [];
        $scope.currentUsers.forEach((user) => {
          const userName = user.name.toLowerCase();
          const userEmail = user.email.toLowerCase();

          if (userName.indexOf($scope.searchString.toLowerCase()) !== -1) {
            $scope.userMatches.push(user);
          } else if (userEmail === $scope.searchString.toLowerCase()) {
            $scope.userMatches.push(user);
          }
        });

        $scope.userMatches.forEach((user) => {
          $scope.invitedUsers = JSON.parse(sessionStorage.invitedUsers);
          user.disabled = $scope.invitedUsers.includes(user.name);
        });

        return $scope.userMatches;
      };

      $scope.startGameChoice = false;

      $scope.startGame = () => {
        if (game.players.length >= game.playerMinLimit
          && game.players.length < game.playerMaxLimit) {
          displayMessage('You are about to start a new game. ' +
            'Do you want to continue?', '#message-modal');

          if ($scope.startGameChoice) {
            game.startGame();
            $scope.showInviteButton = false;
          }
        } else {
          const minNumberOfPlayersLeft =
            game.playerMinLimit - game.players.length;
          displayMessage(`You need at least ${minNumberOfPlayersLeft}
          more player${minNumberOfPlayersLeft > 1 ? 's' : ''}
            to be able to start. `, '#error-modal');
        }
      };

      $scope.abandonGame = function () {
        sessionStorage.invitedUsers = JSON.stringify([]);
        game.leaveGame();
        $location.path('/');
      };

      $scope.shuffleCards = () => {
        const card = $('#card');
        card.addClass('animated flipOutX');
        $timeout(() => {
          $scope.startNextRound();
          card.removeClass('animated flipOutX');
          $('#closeModal').click();
        }, 2000);
      };

      $scope.startNextRound = () => {
        if ($scope.isCzar()) {
          game.startNextRound();
        }
      };

      // Catches changes to round to update when no players pick card
      // (because game.state remains the same)
      $scope.$watch('game.round', () => {
        $scope.hasPickedCards = false;
        $scope.showTable = false;
        $scope.winningCardPicked = false;
        $scope.makeAWishFact = makeAWishFacts.pop();
        if (!makeAWishFacts.length) {
          makeAWishFacts = MakeAWishFactsService.getMakeAWishFacts();
        }
        $scope.pickedCards = [];
      });

      // In case player doesn't pick a card in time, show the table
      $scope.$watch('game.state', () => {
        if (game.state === 'waiting for czar to decide'
          && $scope.showTable === false) {
          $scope.showTable = true;
        }
        if ($scope.isCzar() && game.state === 'pick black card'
          && game.state !== 'game dissolved'
          && game.state !== 'awaiting players' && game.table.length === 0) {
          displayMessage('', '#card-modal');
        }
        if ($scope.isCzar() === false && game.state === 'pick black card'
          && game.state !== 'game dissolved'
          && game.state !== 'awaiting players' && game.table.length === 0) {
          $scope.czarHasDrawn = 'Wait! Czar is drawing Card';
        }
        if (game.state !== 'pick black card'
          && game.state !== 'awaiting players'
          && game.state !== 'game dissolve') {
          $scope.czarHasDrawn = '';
        }
      });

      $scope.$watch('game.gameID', () => {
        if (game.gameID && game.state === 'awaiting players') {
          if (!$scope.isCustomGame() && $location.search().game) {
            // If the player didn't successfully enter the request room,
            // reset the URL so they don't think they're in the requested room.
            $location.search({});
          } else if ($scope.isCustomGame() && !$location.search().game) {
            // Once the game ID is set,
            // update the URL if this is a game with friends,
            // where the link is meant to be shared.
            $location.search({ game: game.gameID });
            if (!$scope.modalShown) {
              setTimeout(() => {
                const link = document.URL;
                const txt = `Give the following link to your
                friends so they can join your game: `;
                $('#lobby-how-to-play').text(txt);
                $('#oh-el').css(
                  {
                    'text-align': 'center',
                    'font-size': '22px',
                    background: 'white',
                    color: 'black'
                  }).text(link);
              }, 20);
              $scope.modalShown = true;
            }
          }
        }
      });

      $scope.countries =
        [
          {
            country: 'General',
            regionId: '58f4de8ef08434413b6aec50'
          },
          {
            country: 'Nigeria',
            regionId: '58ed5fbe75ebcefb68f19750'
          },
          {
            country: 'USA',
            regionId: '58f531a4f08434413b6aec51'
          },
          {
            country: 'South Africa',
            regionId: '58ed60a875ebcefb68f19751'
          },
          {
            country: 'Kenya',
            regionId: '58ed60a875ebcefb68f19752'
          },
          {
            country: 'Uganda',
            regionId: '58ed60a875ebcefb68f19753'
          },
          {
            country: 'Ghana',
            regionId: '58ed60a875ebcefb68f19754'
          },
          {
            country: 'England',
            regionId: '58ed620175ebcefb68f19769'
          },
          {
            country: 'Spain',
            regionId: '58ed620175ebcefb68f1976a'
          },
          {
            country: 'Germany',
            regionId: '58ed620175ebcefb68f1976b'
          },
          {
            country: 'China',
            regionId: '58ed620175ebcefb68f1976c'
          },
          {
            country: 'India',
            regionId: '58ed620175ebcefb68f1976d'
          },
          {
            country: 'Italy',
            regionId: '58ed620175ebcefb68f1976e'
          },
          {
            country: 'France',
            regionId: '58ed620175ebcefb68f1976f'
          },
          {
            country: 'Mexico',
            regionId: '58f53908f08434413b6aec52'
          },
          {
            country: 'Canada',
            regionId: '58f8990ef08434413b6aed4e'
          },
          {
            country: 'Brazil',
            regionId: '58f89970f08434413b6aed4f'
          }
        ];

      $scope.selectedCountry = $scope.countries[0];

      $scope.selectCountry = (region) => {
        if (region) {
          $http.post('/api/selected-region',
            { regionId: '58f4de8ef08434413b6aec50' });
        } else {
          const chosenCountry = angular.element(document
            .querySelector('#selectedCountry')).val();
          $scope.selectedCountryId = $scope.countries[chosenCountry].regionId;
          $http.post('/api/selected-region',
            { regionId: $scope.selectedCountryId });
        }
      };

      if ($location.search().game && !(/^\d+$/).test($location.search().game)) {
        console.log('joining custom game');
        game.joinGame('joinGame', $location.search().game);
      } else if ($location.search().custom) {
        game.joinGame('joinGame', null, true);
      } else {
        game.joinGame();
      }
    }]);
