require(['/component/fragment/player.js', '/component/favorite.js', '/vendor/angular.js', '/vendor/chiptune2.js', '/vendor/libopenmpt.min.js', '/component/utils.js', '/vendor/sweetalert.min.js'], function (fragmentPlayer, favorite) {
  var app = angular.module("theChiptuneApplication", []);
  //app.value('$sniffer', {history: true});
  app.controller("mainController", function ($scope, $http, $location, $browser) {
    var player = new ChiptuneJsPlayer();
    fragmentPlayer($http, player);

    $scope.favorites = favorite.getList();
    var location = $location.path().split("/");
    location.shift();
    if (location[0].length == "") {
      location.shift();
    }

    $scope.branch = function (url, completed) {
      if (url && url.length != 0) location.push(url);
      if (this != "first") $browser.url("/" + location.join("/"));
      $http({
        method: "GET",
        url: "/resource/" + location.join("/")
      }).then(function (response) {
        $scope.locationLength = location.length;
        $scope.previousLocation = location[location.length - 1] || "/";
        $scope.location = location.join('/');
        response.data.forEach(function (item) {
          item.url = location.join("/") + "/" + btoa(item.resource).replace(/=/g, '');
          if (item.isDirectory == false) {
            var dot = item.resource.lastIndexOf(".");
            item.attribute = item.resource.substring(dot + 1);
            item.name = item.resource.substring(0, dot);
            item.favorite = favorite.hasIn(item);
          }
        });
        $scope.items = response.data;

        if (completed) {
          completed();
        }
      });
    };


    $scope.currentLocationOfMusic = 0.0;
    var intervalSpeed = 1000;
    setInterval(function () {
      if ($scope.isPlaying) {
        $scope.currentLocationOfMusic = ($scope.currentLocationOfMusic + intervalSpeed / 1000) % $scope.duration;
        $scope.$apply();
      }
    }, intervalSpeed);

    player.onEnded(function () {
      var index;
      $scope.currentLocationOfMusic = $scope.duration;
      $scope.isPlaying = false;
      if ($scope.isPlaylistAuto) {
        var properties = Object.getOwnPropertyNames($scope.favorites);
        index = properties.findIndex(function (item) {
          if (item == 'length') return false;
          return $scope.favorites[item].url == $scope.playingItem.url;
        });

        if (index != -1 && index + 1 <= $scope.favorites.length) {
          $scope.enter($scope.favorites[properties[index + 1]]);
        }
      } else if ($scope.isAuto) {
        index = $scope.orderedItems.findIndex(function (item) {
          return item == $scope.playingItem;
        });

        if (index != -1 && index + 2 <= $scope.orderedItems.length) {
          $scope.enter($scope.orderedItems[index + 1]);
        }
      }
    });

    $scope.savePlaylist = function () {
      if ($scope.favorites.length == 0) return;
      $http({
        method: 'POST',
        url: '/favorites',
        data: JSON.stringify($scope.favorites)
      }).then(function (data) {
        swal("Playlist saved!", "Your unique key: " + data.data + "\nKeep it, you need it when load", "success");
      }).catch(function (data) {
        swal("Error occurred", "Something happened when your playlist saving :(", "error");
      });
    };

    $scope.loadPlaylist = function () {
      swal({
        title: "Load playlist",
        text: "Please put your unique playlist key:",
        type: "input",
        showCancelButton: true,
        showLoaderOnConfirm: true,
        closeOnConfirm: false,
        animation: "slide-from-top",
        inputPlaceholder: "unique key"
      }, function (inputValue) {
        if (inputValue === false) return false;
        if (inputValue === "") {
          swal.showInputError("You need to write something!");
          return false
        }

        $http({
          method: 'GET',
          url: '/favorites/' + inputValue
        }).then(function (data) {
          if ($scope.favorites.length > 0) {
            swal({
              title: "What i should do?",
              text: "You have own favorites, should i append the list? or delete the old ones and load new!",
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: "Override the list",
              cancelButtonText: "No, just append",
              closeOnConfirm: false,
              closeOnCancel: false
            }, function (isConfirm) {
              if (isConfirm) {
                favorite.clearList();
                favorite.loadFrom(data);
                swal("Playlist loaded!", "Previous playlist overloaded with new one", "success");
              } else {
                favorite.loadFrom(data);
                swal("Playlist loaded!", "All tracks added to your playlist", "success");
              }
            });
          } else {
            favorite.loadFrom(data);
            swal("Playlist loaded!", "All tracks added to your playlist", "success");
          }
        }).catch(function (data) {
          swal("Error occurred", "Invalid unique playlist key, please validate your key", "error");
        })
      });
    };

    $scope.favorite = function (item) {
      item.favorite = !item.favorite;
      favorite.toggle(item);
    };

    $scope.play = function () {
      if ($scope.isPlaying == false) {
        player.unpause();
        $scope.isPlaying = true;
      }
    };

    $scope.pause = function () {
      if ($scope.isPlaying == true) {
        player.pause();
        $scope.isPlaying = false;
      }
    };

    $scope.home = function () {
      location = [];
      $scope.branch();
    };

    $scope.branchUp = function () {
      location.pop();
      $scope.branch();
    };

    $scope.enter = function (item, e) {
      if (e) e.preventDefault();
      var self = this;
      if (item.isDirectory == true) {
        return $scope.branch(item.resource);
      } else {
        function playMusic () {
          player.stop();
          $scope.playing = item.resource;
          ($scope.replay = function () {
            player.load("/resource/get/" + location.join("/") + "/" + encodeURI(item.resource), function (buffer) {
              player.config.repeatCount = $scope.isLoop == true ? -1 : 0;
              $scope.isPlaying = true;
              $scope.playingItem = item;
              player.play(buffer);
              $scope.duration = player.duration();
              $scope.currentLocationOfMusic = 0.0;
              $scope.$apply();
              if (self != "first") $browser.url("/" + location.join("/") + "/" + btoa(item.resource).replace(/=/g, "") + ($scope.isLoop == true ? "&loop=true" : ""));
            });
          })();
        }

        if (item.url) {
          var pp = item.url.split('/');
          pp.pop();
          if (pp.join("/") == location.join("/")) {
            playMusic();
          } else {
            location = pp;
            $scope.branch(undefined, function () {
              playMusic();
            });
          }
        } else {
          playMusic();
        }
      }
    };

    var directPlay = location[location.length - 1];
    $scope.isLoop = !!($location.search().loop || false);

    $scope.loop = function (value) {
      if (!$scope.replay) return;
      $scope.isLoop = value;
      $scope.replay();
    };

    $scope.isAuto = false;
    $scope.isPlaylistAuto = false;
    $scope.auto = function (value) {
      $scope.isAuto = value;
      if (value == true) {
        $scope.isPlaylistAuto = false;
      }
    };

    $scope.playListAutoToggle = function () {
      $scope.isPlaylistAuto = !$scope.isPlaylistAuto;
      if ($scope.isPlaylistAuto == true) {
        $scope.isAuto = false;
      }
    };

    try {
      directPlay = atob(directPlay);
      location.pop();

      if (directPlay.trim() == "") {
        throw 1;
      }

      $scope.branch.call("first", undefined, function () {
        var index = $scope.items.findIndex(function (item) {
          return item.resource == directPlay;
        });
        if (index != -1) {
          $scope.enter.call("first", $scope.items[index]);
        }
      });
    } catch (e) {
      $scope.branch();
    }

  }).config(function ($locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
  });
});