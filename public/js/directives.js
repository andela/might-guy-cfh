angular.module('mean.directives', [])
  .directive('player', function (){
    return{
      restrict: 'EA',
      templateUrl: '/views/player.html',
      link: function(scope, elem, attr){
        scope.colors = ['#7CE4E8', '#FFFFa5', '#FC575E', '#F2ADFF', '#398EC4', '#8CFF95'];
      }
    };
  }).directive('answers', function() {
    return {
      restrict: 'EA',
      templateUrl: '/views/answers.html',
      link: function (scope, elem) {

        scope.$watch('game.state', function() {
          if (scope.game.state === 'winner has been chosen') {
            var curQ = scope.game.curQuestion;
            var curQuestionArr = curQ.text.split('_');
            var startStyle = "<span style='color: "+scope.colors[scope.game.players[scope.game.winningCardPlayer].color]+"'>";
            var endStyle = "</span>";
            var shouldRemoveQuestionPunctuation = false;
            var removePunctuation = function(cardIndex) {
              var cardText = scope.game.table[scope.game.winningCard].card[cardIndex].text;
              if (cardText.indexOf('.',cardText.length-2) === cardText.length-1) {
                cardText = cardText.slice(0,cardText.length-1);
              } else if ((cardText.indexOf('!',cardText.length-2) === cardText.length-1 ||
                cardText.indexOf('?',cardText.length-2) === cardText.length-1) &&
                cardIndex === curQ.numAnswers-1) {
                shouldRemoveQuestionPunctuation = true;
              }
              return cardText;
            };
            if (curQuestionArr.length > 1) {
              var cardText = removePunctuation(0);
              curQuestionArr.splice(1,0,startStyle+cardText+endStyle);
              if (curQ.numAnswers === 2) {
                cardText = removePunctuation(1);
                curQuestionArr.splice(3,0,startStyle+cardText+endStyle);
              }
              curQ.text = curQuestionArr.join("");
              // Clean up the last punctuation mark in the question if there already is one in the answer
              if (shouldRemoveQuestionPunctuation) {
                if (curQ.text.indexOf('.',curQ.text.length-2) === curQ.text.length-1) {
                  curQ.text = curQ.text.slice(0,curQ.text.length-2);
                }
              }
            } else {
              curQ.text += ' '+startStyle+scope.game.table[scope.game.winningCard].card[0].text+endStyle;
            }
          }
        });
      }
    };
  }).directive('question', function() {
    return {
      restrict: 'EA',
      templateUrl: '/views/question.html',
      link: (scope) => {
        if (scope.isCustomGame()) {
          scope.showInviteButton = true;
        } else {
          scope.showInviteButton = false;
        }
      }
    };
  })
  .directive('timer', function(){
    return{
      restrict: 'EA',
      templateUrl: '/views/timer.html',
      link: function(scope, elem, attr){}
    };
  }).directive('landing', function() {
    return {
      restrict: 'EA',
      link: function(scope, elem, attr) {
        scope.showOptions = true;

        if (scope.$$childHead.global.authenticated === true) {
          scope.showOptions = false;
        }
      }
    };
  })
  .directive('leaderboard', ['$http', $http => ({
    restrict: 'A',
    link: (scope) => {
      $http.get('/api/leaderboard')
        .success((response) => {
          scope.leaderboard = response;
        });
    },
    template:
    `
    <div ng-show="leaderboard.length === 0" style="background: #213367;
     color: white; height: 250px; text-align: center; padding-top: 110px;
     font-size: 1.5em;">
      There's no leaderboard yet. Looks like everyone's making Heaven.
    </div>

    <table class="table " style="background: #213367; color: white"
      ng-show="leaderboard.length > 0">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Number of Wins</th>
        </tr>
      </thead>

      <tbody>
        <tr ng-repeat="player in leaderboard track by $index">
          <td>{{$index + 1}}</td>
          <td>{{player.name}}</td>
          <td>{{player.gameWins}}</td>
         </tr>
      </tbody>
    </table>

    `,
  })])
  .directive('history', ['$http', '$window', ($http, $window) => ({
    restrict: 'A',
    link: (scope) => {
      const userName = $window.user.name;
      $http.get('/api/games/history', { params: { name: userName } })
        .success((response) => {
          scope.gameHistory = response;
        });
    },
    template:
    `
    <div ng-show="gameHistory.length === 0" style="background: #213367;
     color: white; height: 250px; text-align: center; padding-top: 110px;
     font-size: 1.5em;">
      You have not participated in any game yet.
      You shouldn't lead a boring life, you know.
    </div>

      <div ng-repeat="game in gameHistory" style="margin-bottom: 10px;
        background: #213367; color: white">
            <div style="font-size: 1.1em; margin: 0px 0px 10px 10px;">
              <strong style="padding:18px;">Date: {{game.gamePlayDate}}
              &nbsp;&nbsp;&nbsp;&nbsp;Time: {{game.gamePlayTime}} </strong>
            </div>
            <table class="table" style="background: white; color: black;">
              <thead>
                <tr>
                  <th>Game Rounds</th>
                  <th>Game Players</th>
                  <th>Game Winner</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td> {{game.gameRounds}} </td>
                  <td>
                    <p ng-repeat="player in game.gamePlayers track by $index">
                      {{player}}
                    </p>
                  </td>
                  <td> {{game.winner}} </td>
                </tr>
              </tbody>
            </table>
       </div>
       `,
  })])
  .directive('chatbox', ['socket', socket => ({
    restrict: 'AE',
    replace: true,
    link: (scope, element) => {
        // Send chat message
      scope.sendChatMessage = () => {
        const chat = {};
        chat.message = $('.emojionearea-editor').html();
        if (!chat.message) return;
        chat.date = new Date().toString();
        chat.avatar = window.localStorage.getItem('avatar');
        chat.username = window.localStorage.getItem('username');
        socket.emit('chat message', chat);
        $('.emojionearea-editor').html('');
      };

      // display a chat message
      const displayChat = (chat) => {
        const month = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec'
        ];
        const date = new Date(chat.date);
        element.append(
          `<div class="chat"> <div class="chat-meta">
          <img src="${chat.avatar}"> ${chat.username} <br> 
          ${month[date.getMonth()]} ${date.getDate()},
          ${date.getHours()}:${date.getMinutes()} </div>
          <div class="clearfix"></div>
          <div class="chat-message">${chat.message}</div></div>`
        );
        $('#chatContent').scrollTop(element.height());
        if (chat.username !== window.localStorage.getItem('username')) {
          $('#chatNotification').show();
        }
      };

      // set current players details to localStorage and initialize the emoji
      scope.setPlayer = (avatar, username) => {
        window.localStorage.setItem('avatar', avatar);
        window.localStorage.setItem('username', username);

        $('#chatInput').emojioneArea({
          pickerPosition: 'top',
          filtersPosition: 'top',
          tones: false,
          autocomplete: false,
          inline: true,
          hidePickerOnBlur: true
        });
        scope.isPlayerSet = true;
      };

        // Initializes chat when socket is connected
      socket.on('initializeChat', (messages) => {
        messages.forEach((chat) => {
          displayChat(chat);
        });
      });

        // listen for chat messages
      socket.on('chat message', (chat) => {
        displayChat(chat);
      });

        // Submit the chat when the 'enter' key is pressed
      $('body').on('keyup', '.emojionearea-editor', (event) => {
        if (event.which === 13) {
          scope.sendChatMessage();
        }
      });
    },
  })])
  .directive('donations', ['$http', '$window', ($http, $window) => ({
    restrict: 'A',
    link: (scope) => {
      const userName = $window.user.name;
      $http.get('/api/donations', { params: { name: userName } })
        .success((response) => {
          scope.userDonations = response;
        });
    },
    template:
    `
    <div ng-show="userDonations.length === 0" style="background: #1a306f;
     color: white; height: 250px; text-align: center; padding-top: 110px;
     font-size: 1.5em; margin-top: 20px;">
      You have no donations yet. Ain't you just miserly?
    </div>

    <div ng-repeat="donation in userDonations">
      {{donation}}
    </div>
    `,
  })]);
