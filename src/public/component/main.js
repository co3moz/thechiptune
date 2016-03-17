var app = angular.module("theChiptuneApplication", []);
app.value('$sniffer', {history: true});
app.controller("mainController", function ($scope, $http, $location, $browser) {
  var player = new ChiptuneJsPlayer();

  $http.get('/component/fragment/player.frag').success(function(data) {
    var analyser = player.context.createAnalyser();
    var bufferLength = (analyser.fftSize = 64);
    var dataArray = new Uint8Array(bufferLength);
    var floatArray = new Float32Array(dataArray);

    if(player.currentPlayingNode) {
      player.currentPlayingNode.disconnect();
      player.currentPlayingNode.connect(analyser);
    }

    player.destination = analyser;
    analyser.connect(player.context.destination);

    (function draw() {
      analyser.getByteTimeDomainData(dataArray);
      for(var i = 0; i < bufferLength; i++) {
        if(floatArray[i] == 0) floatArray[i] = 1.0;
        floatArray[i] = (floatArray[i] * 2.0 + dataArray[i] * dataArray[i] / floatArray[i]) / 3.0;
      }
      requestAnimationFrame(draw);
    })();

    Glsl({
      canvas: document.getElementsByClassName("gl")[0],
      fragment: data,
      variables: {
        data: floatArray
      },
      update: function (time, delta) {
        this.sync("data");
      }
    }).start();
  });


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
      response.data.forEach(function (item) {
        if (item.isDirectory == false) {
          var dot = item.resource.lastIndexOf(".");
          item.attribute = item.resource.substring(dot + 1);
          item.name = item.resource.substring(0, dot);
          item.url = btoa(item.resource).replace(/=/g,'');
        }
      });
      $scope.items = response.data;
    });
  };

  $scope.numberToMinutes = function(number) {
    var minutes = number / 60 >> 0;
    var seconds = number % 60 >> 0;
    return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
  };

  $scope.biquadMode = false;
  $scope.biquadToggle = function() {
    if($scope.biquadMode == false) {
      var biquadFilter = player.context.createBiquadFilter();
      player.currentPlayingNode.disconnect();
      player.destination = biquadFilter;
      player.currentPlayingNode.connect(biquadFilter);
      biquadFilter.connect(player.context.destination);
    } else {
      player.currentPlayingNode.disconnect();
      player.destination = player.context.destination;
      player.currentPlayingNode.connect(player.destination);
    }
    $scope.biquadMode = !$scope.biquadMode;
  };

  var currentLocationOfMusic = 0.0;
  var intervalSpeed = 1000;
  setInterval(function () {
    if ($scope.isPlaying) {
      $scope.percent = Math.min(100, currentLocationOfMusic / $scope.duration * 100);
      $scope.currentLocationOfMusic = currentLocationOfMusic;
      currentLocationOfMusic += intervalSpeed / 1000;
      currentLocationOfMusic = currentLocationOfMusic % $scope.duration;
      $scope.$apply();
    }
  }, intervalSpeed);

  player.onEnded(function() {
    currentLocationOfMusic = $scope.duration;
    $scope.isPlaying = false;
    if($scope.isAuto) {
      var index = $scope.orderedItems.findIndex(function(item) {
        return item == $scope.playingItem;
      });

      if(index != -1 && index + 2 <= $scope.orderedItems.length) {
        $scope.enter($scope.orderedItems[index + 1]);
      }
    }
  });

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
    if(e) e.preventDefault();
    if (item.isDirectory == true) {
      return $scope.branch(item.resource);
    } else {
      player.stop();
      $scope.playing = item.resource;
      $scope.replay = function () {
        player.load("/resource/get/" + location.join("/") + "/" + encodeURI(item.resource), function (buffer) {
          player.config.repeatCount = $scope.isLoop == true ? -1 : 0;
          $scope.isPlaying = true;
          $scope.playingItem = item;
          player.play(buffer);
          $scope.duration = player.duration();
          currentLocationOfMusic = 0.0;
          $browser.url("/" + location.join("/") + "?play=" + btoa(item.resource).replace(/=/g, "") + ($scope.isLoop == true ? "&loop=true" : ""));
        });
      };

      $scope.replay();
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

  var directPlay = $location.search().play;
  $scope.isLoop = !!($location.search().loop || false);
  $scope.branch();

  $scope.loop = function (value) {
    $scope.isLoop = value;
    $scope.replay();
  };

  $scope.isAuto = false;
  $scope.auto = function (value) {
    $scope.isAuto = value;
  };

  if (directPlay) {
    $scope.enter({resource: atob(directPlay), isDirectory: false});
  }
}).config(function ($locationProvider) {
  $locationProvider.html5Mode(true).hashPrefix('!');
});