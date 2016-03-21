/**
 player.frag
 @author co3moz
 @date 17.03.2016
*/

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float data[64];
uniform float frequency[32];


void main(void) {
  vec2 aspect = resolution.xy / min(resolution.x, resolution.y);
  vec2 p = (gl_FragCoord.xy / resolution.xy) * aspect;

  gl_FragColor = vec4(0.0);

  for (int i = 0; i < 64; i++) {
      if (distance(p, vec2(float(i) / 64.0, data[i] / 256.0) * aspect) < 0.05) {
        gl_FragColor = vec4(1.0);
      }


      if (distance(p, vec2(float(i) / 32.0, frequency[i] / 512.0) * aspect) < 0.05) {
        gl_FragColor = vec4(sin(time), sin(time + 2.04), sin(time + 4.08), 1.0);
      }
  }
}