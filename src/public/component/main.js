var app = angular.module("theChiptuneApplication", []);
app.constant('baseHref', '/base/index.html')
  .value('$sniffer', {history: true});
app.controller("mainController", function ($scope, $http, $location, $browser) {

  var player = new ChiptuneJsPlayer();
  window.anan = player;
  var location = $location.path().split("/");
  location.shift();
  if (location[0].length == "") {
    location.shift();
  }

  $scope.branch = function (url) {
    if (url && url.length != 0) location.push(url);
    $browser.url("/" + location.join("/"));
    $http({
      method: "GET",
      url: "/resource/" + location.join("/")
    }).then(function (response) {
      $scope.locationLength = location.length;
      $scope.previousLocation = location[location.length - 1] || "/";
      $scope.items = response.data;
    });
  };

  var currentLocationOfMusic = 0.0;
  var intervalSpeed = 500;
  setInterval(function () {
    if ($scope.isPlaying) {
      $scope.percent = Math.min(100, currentLocationOfMusic / $scope.duration * 100);
      currentLocationOfMusic += intervalSpeed / 1000;
      $scope.$apply();
    }
  }, intervalSpeed);

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

  $scope.enter = function (item) {
    if (item.isDirectory == true) {
      return $scope.branch(item.resource);
    } else {
      $scope.playing = item.resource;
      player.load("/resource/get/" + location.join("/") + "/" + encodeURI(item.resource), function (buffer) {
        player.play(buffer);
        $browser.url("/" + location.join("/") + "#" + encodeURI(item.resource));
        $scope.isPlaying = true;
        $scope.duration = player.duration();
        currentLocationOfMusic = 0.0;
      });
    }
  };

  $scope.sizeConvert = function (size) {
    if (size < 1024) {
      return size + "b";
    }

    if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + "kb";
    }

    if (size < 1024 * 1024 * 1024) {
      return (size / 1024 / 1024).toFixed(2) + "mb";
    }

    return (size / 1024 / 1024 / 1024).toFixed(2) + "gb";
  };

  var directPlay = $location.hash();
  if(directPlay) {
    $scope.enter({resource: directPlay, isDirectory: false});
  }

  $scope.branch();
}).config(function ($locationProvider) {
  $locationProvider.html5Mode(true).hashPrefix('!');
});