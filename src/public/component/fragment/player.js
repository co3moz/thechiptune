define(['/vendor/glsl.min.js'], function (Glsl) {
  return function ($http, player) {
    $http.get('/component/fragment/player.frag').success(function (data) {
      var analyser = player.context.createAnalyser();
      var bufferLength = (analyser.fftSize = 64);
      var dataArray = new Uint8Array(bufferLength);
      var frequencyDataArray = new Uint8Array(bufferLength);
      var floatArray = new Float32Array(dataArray);
      var frequencyArray = new Float32Array(dataArray);

      if (player.currentPlayingNode) {
        player.currentPlayingNode.disconnect();
        player.currentPlayingNode.connect(analyser);
      }

      player.destination = analyser;
      analyser.connect(player.context.destination);

      (function draw () {
        analyser.getByteTimeDomainData(dataArray);
        analyser.getByteFrequencyData(frequencyDataArray);

        for (var i = 0; i < bufferLength; i++) {
          if (floatArray[i] == 0) floatArray[i] = 1.0;
          floatArray[i] = (floatArray[i] * 2.0 + dataArray[i] * dataArray[i] / floatArray[i]) / 3.0;
          frequencyArray[i] = frequencyDataArray[i];
        }
        requestAnimationFrame(draw);
      })();


      Glsl({
        canvas: document.getElementsByClassName("gl")[0],
        fragment: data,
        variables: {
          data: floatArray,
          frequency: frequencyArray,
          time: 0
        },
        update: function (time) {
          this.set("time", time / 1000.0);
          this.sync("data", "frequency");
        }
      }).start();
    });
  };
});