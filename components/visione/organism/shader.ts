/**
 * The organism's skin. One warm field of ink on bone paper — domain-warped
 * fractal noise that breathes, churns, flows, and burns depending on which beat
 * of the manifesto the reader is in. It never paints the background opaque; it
 * pools and stains soot/umber/ember WITHIN the bone paper, so the catalogue
 * ground always shows through.
 *
 * Driving uniforms:
 *   uTime    — seconds, for the slow breath.
 *   uBeat    — eased current beat index (0..6), fractional during transitions.
 *   uIgnite  — 0..1, the blood-and-fire bloom (beat 5).
 *   uTurb    — 0..1, labyrinth turbulence (beat 3).
 *   uFlow    — 0..1, directional current (beat 4).
 *   uDepth   — 0..1, submersion / sinking (beat 2).
 *   uSeed    — 0..1, the final cooled ember (beat 7).
 *   uIntensity — 0..1, global master fade (reduced-motion / idle damping).
 */

export const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const fragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform float uBeat;
  uniform float uIgnite;
  uniform float uTurb;
  uniform float uFlow;
  uniform float uDepth;
  uniform float uSeed;
  uniform float uIntensity;
  uniform float uScroll;     // 0..1 page progress
  uniform vec2  uIgnitePos;  // where the fire blooms (the swell line), 0..1

  // Warm palette — the manifesto's world. No pure black/white.
  const vec3 PAPER = vec3(0.925, 0.890, 0.824); // bone (#ece3d2)
  const vec3 SOOT  = vec3(0.078, 0.066, 0.050); // warm bistre (#14110d)
  const vec3 UMBER = vec3(0.227, 0.137, 0.090);
  const vec3 EMBER = vec3(0.604, 0.200, 0.133); // oxblood (#9a3322)
  const vec3 FIRE  = vec3(0.753, 0.286, 0.184); // ember-bright (#c0492f)

  // --- value noise + fbm ---------------------------------------------------
  vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123) * 2.0 - 1.0;
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p, int oct) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 6; i++) {
      if (i >= oct) break;
      v += amp * noise(p);
      p *= 2.0;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    // Aspect-correct coords centred at 0.
    vec2 R = uResolution;
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(R.x / R.y, 1.0);

    float t = uTime * 0.06;          // slow breath
    float churn = uTurb;             // labyrinth
    float flow = uFlow;              // current

    // Domain warp — the living motion. Turbulence sharpens it; flow drags it.
    vec2 q = vec2(
      fbm(p * 1.6 + vec2(0.0, t), 4),
      fbm(p * 1.6 + vec2(5.2, t * 1.3), 4)
    );
    vec2 drift = vec2(flow * (t * 2.0), -flow * 0.3);
    float warpAmt = 0.55 + churn * 1.6;
    vec2 r = vec2(
      fbm(p * 1.9 + q * warpAmt + drift + vec2(1.7, 9.2), 5),
      fbm(p * 1.9 + q * warpAmt + drift + vec2(8.3, 2.8), 5)
    );

    float field = fbm(p * 1.5 + r * (0.9 + churn), 5);
    field = field * 0.5 + 0.5;       // -> 0..1

    // Breath: the whole field swells gently.
    float breath = 0.5 + 0.5 * sin(uTime * 0.22);
    field += (breath - 0.5) * 0.06;

    // --- staining: ink pools in the lows, paper stays in the highs ----------
    // Submersion (beat 2) deepens the pools and pulls the midtones down.
    float ink = smoothstep(0.62 - uDepth * 0.22, 0.18, field);
    ink *= 0.42 + uDepth * 0.30;

    // Vertical gradient: heavier toward the lower edge, like settling sediment.
    ink *= mix(0.7, 1.15, smoothstep(0.0, 1.0, uv.y));

    vec3 col = PAPER;
    col = mix(col, UMBER, ink * 0.85);
    col = mix(col, SOOT,  ink * ink * (0.5 + uDepth * 0.4));

    // --- ember veins: faint warmth threading the ink at rest ---------------
    float veins = smoothstep(0.55, 0.85, field) * (0.10 + uSeed * 0.10);
    col = mix(col, EMBER, veins * 0.25);

    // --- the blood-and-fire bloom (beat 5) ---------------------------------
    if (uIgnite > 0.001) {
      vec2 fp = (uv - uIgnitePos) * vec2(R.x / R.y, 1.0);
      float d = length(fp);
      // Embers: a few drifting hot points rising from the bloom centre.
      float emberMask = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float rise = fract(uTime * (0.10 + fi * 0.013) + fi * 0.37);
        vec2 ep = uIgnitePos + vec2(
          (hash22(vec2(fi, 3.0)).x) * 0.12,
          -rise * 0.42 + 0.05
        );
        vec2 d2 = (uv - ep) * vec2(R.x / R.y, 1.0);
        float glow = 0.0009 / (dot(d2, d2) + 0.0006);
        emberMask += glow * (1.0 - rise);
      }
      // The bloom core: oxblood bleed -> bright fire at the centre.
      float bloom = smoothstep(0.55, 0.0, d) * uIgnite;
      col = mix(col, EMBER, bloom * 0.55);
      col = mix(col, FIRE, smoothstep(0.22, 0.0, d) * uIgnite * 0.7);
      col += FIRE * emberMask * uIgnite * 0.6;
    }

    // --- the final cooled seed (beat 7): one warm living point -------------
    if (uSeed > 0.001) {
      vec2 sp = (uv - vec2(0.5, 0.46)) * vec2(R.x / R.y, 1.0);
      float sd = length(sp);
      float pulse = 0.5 + 0.5 * sin(uTime * 0.6);
      float seedGlow = smoothstep(0.10, 0.0, sd) * uSeed * (0.4 + pulse * 0.5);
      col = mix(col, EMBER, seedGlow * 0.5);
      col += FIRE * smoothstep(0.03, 0.0, sd) * uSeed * pulse * 0.4;
    }

    // Grain — paper tooth, keeps it from looking digital.
    float grain = (hash22(uv * R + t).x) * 0.012;
    col += grain;

    // Master intensity (reduced-motion / idle damping fades the ink toward paper).
    col = mix(PAPER, col, clamp(uIntensity, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
  }
`;
