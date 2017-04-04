angular.module('mean.system')
.controller('GameController', ['$scope', 'game', '$timeout', '$location', 'MakeAWishFactsService', '$dialog', '$http', function ($scope, game, $timeout, $location, MakeAWishFactsService, $dialog, $http) {
    $scope.hasPickedCards = false;
    $scope.winningCardPicked = false;
    $scope.showTable = false;
    $scope.modalShown = false;
    $scope.game = game;
    $scope.pickedCards = [];
    var makeAWishFacts = MakeAWishFactsService.getMakeAWishFacts();
    $scope.makeAWishFact = makeAWishFacts.pop();

    $scope.pickCard = function(card) {
      if (!$scope.hasPickedCards) {
        if ($scope.pickedCards.indexOf(card.id) < 0) {
          $scope.pickedCards.push(card.id);
          if (game.curQuestion.numAnswers === 1) {
            $scope.sendPickedCards();
            $scope.hasPickedCards = true;
          } else if (game.curQuestion.numAnswers === 2 &&
            $scope.pickedCards.length === 2) {
            //delay and send
            $scope.hasPickedCards = true;
            $timeout($scope.sendPickedCards, 300);
          }
        } else {
          $scope.pickedCards.pop();
        }
      }
    };

    $scope.pointerCursorStyle = function() {
      if ($scope.isCzar() && $scope.game.state === 'waiting for czar to decide') {
        return {'cursor': 'pointer'};
      } else {
        return {};
      }
    };

    $scope.sendPickedCards = function() {
      game.pickCards($scope.pickedCards);
      $scope.showTable = true;
    };

    $scope.cardIsFirstSelected = function(card) {
      if (game.curQuestion.numAnswers > 1) {
        return card === $scope.pickedCards[0];
      } else {
        return false;
      }
    };

    $scope.cardIsSecondSelected = function(card) {
      if (game.curQuestion.numAnswers > 1) {
        return card === $scope.pickedCards[1];
      } else {
        return false;
      }
    };

    $scope.firstAnswer = function($index){
      if($index % 2 === 0 && game.curQuestion.numAnswers > 1){
        return true;
      } else{
        return false;
      }
    };

    $scope.secondAnswer = function($index){
      if($index % 2 === 1 && game.curQuestion.numAnswers > 1){
        return true;
      } else{
        return false;
      }
    };

    $scope.showFirst = function(card) {
      return game.curQuestion.numAnswers > 1 && $scope.pickedCards[0] === card.id;
    };

    $scope.showSecond = function(card) {
      return game.curQuestion.numAnswers > 1 && $scope.pickedCards[1] === card.id;
    };

    $scope.isCzar = function() {
      return game.czar === game.playerIndex;
    };

    $scope.isPlayer = function($index) {
      return $index === game.playerIndex;
    };

    $scope.isCustomGame = function() {
      return !(/^\d+$/).test(game.gameID) && game.state === 'awaiting players';
    };

    $scope.isPremium = function($index) {
      return game.players[$index].premium;
    };

    $scope.currentCzar = function($index) {
      return $index === game.czar;
    };

    $scope.winningColor = function($index) {
      if (game.winningCardPlayer !== -1 && $index === game.winningCard) {
        return $scope.colors[game.players[game.winningCardPlayer].color];
      } else {
        return '#f9f9f9';
      }
    };

    $scope.pickWinning = function(winningSet) {
      if ($scope.isCzar()) {
        game.pickWinning(winningSet.card[0]);
        $scope.winningCardPicked = true;
      }
    };

    $scope.winnerPicked = function() {
      return game.winningCard !== -1;
    };

    displayMessage = (message, modalID) => {
      $scope.message = message;
      $(modalID).modal();
    };

    $scope.joinName = (name) => {
      return name.split(' ').join('');
    }

    $scope.invite = (user, button) => {
      $scope.invitedUsers = JSON.parse(sessionStorage.invitedUsers);
      if ($scope.invitedUsers.length <= 10) {
        const inviteButton = document.getElementById(`${button.target.id}`);
        inviteButton.disabled = true;
        if ($scope.invitedUsers.indexOf(user.name) === -1) {
          $scope.invitedUsers.push(user.name);
          sessionStorage.invitedUsers = JSON.stringify($scope.invitedUsers);
        }
      } else {
        alert('You can\'t invite more than 11 users.')
      }

      const url = button.target.baseURI;
      const obj = {
        url: url,
        invitee: user.email,
        gameOwner: game.players[0].username
      }

      $http.post('/inviteusers', obj);
    }

    $scope.getUsers = () => {
      $http.get('/api/search/users')
        .success((response) => {

          $scope.currentUsers = response;
          displayMessage('', '#users-modal');

        }, (error) => {
          console.log(error);
        });
    }

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
        user.disabled = $scope.invitedUsers.includes(user.name) ? true : false;
      });

      return $scope.userMatches;
    }

    $scope.startGame = function() {
      if (game.players.length >= game.playerMinLimit
              && game.players.length < game.playerMaxLimit) {
        $scope.gameStarted = true;
        game.startGame();
      } else {
        displayMessage(`You need at least ${game.playerMinLimit - game.players.length} more player(s) to be able to start. `, '#error-modal');
      }
    };

    $scope.abandonGame = function() {
      sessionStorage.invitedUsers = JSON.stringify([]);
      game.leaveGame();
      $location.path('/');
    };

    // Catches changes to round to update when no players pick card
    // (because game.state remains the same)
    $scope.$watch('game.round', function() {
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
    $scope.$watch('game.state', function() {
      if (game.state === 'waiting for czar to decide' && $scope.showTable === false) {
        $scope.showTable = true;
      }
    });

    $scope.$watch('game.gameID', function() {
      if (game.gameID && game.state === 'awaiting players') {
        if (!$scope.isCustomGame() && $location.search().game) {
          // The Invite Player button should be displayed only when playing with friends.
          // $scope.displayInviteButton = false;
          // If the player didn't successfully enter the request room,
          // reset the URL so they don't think they're in the requested room.
          $location.search({});
        } else if ($scope.isCustomGame() && !$location.search().game) {
          // Once the game ID is set, update the URL if this is a game with friends,
          // where the link is meant to be shared.
          // $scope.displayInviteButton = true;
          $location.search({game: game.gameID});
          if(!$scope.modalShown){
            setTimeout(function(){
              var link = document.URL;
              var txt = 'Give the following link to your friends so they can join your game: ';
              $('#lobby-how-to-play').text(txt);
              $('#oh-el').css({'text-align': 'center', 'font-size':'22px', 'background': 'white', 'color': 'black'}).text(link);
            }, 20);
            $scope.modalShown = true;
          }
        }
      }
    });

    if ($location.search().game && !(/^\d+$/).test($location.search().game)) {
      console.log('joining custom game');
      game.joinGame('joinGame',$location.search().game);
    } else if ($location.search().custom) {
      game.joinGame('joinGame',null,true);
    } else {
      game.joinGame();
    }

}]);
