#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform float data[64];

void main(void) {
  vec2 aspect = resolution.xy / min(resolution.x, resolution.y);
  vec2 p = (gl_FragCoord.xy / resolution.xy) * aspect;

  gl_FragColor = vec4(0.0);

  for (int i = 0; i < 64; i++) {
      if (distance(p, vec2(float(i) / 64.0, data[i] / 256.0) * aspect) < 0.05) {
        gl_FragColor = vec4(1.0);
      }
  }
}