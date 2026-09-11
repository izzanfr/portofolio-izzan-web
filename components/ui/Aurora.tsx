"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Bands of light drifting across the top of a surface, adapted from React
 * Bits' Aurora (reactbits.dev/backgrounds/aurora).
 *
 * Changes from the original:
 *  - Plain WebGL2 instead of the `ogl` library: the effect is one full-screen
 *    triangle and one fragment shader, which does not need a scene graph, and
 *    it keeps the site off a new dependency.
 *  - Rendered at half resolution and stretched. The bands are soft by nature,
 *    so the difference does not show, and it is a quarter of the pixels.
 *  - Only animates while on screen; under reduced motion it draws one still
 *    frame. The original drew every frame for as long as it was mounted.
 *  - The colour is output as a translucent tint (premultiplied) over whatever
 *    is behind the canvas, fading to fully clear towards the bottom — so the
 *    surface underneath, not the effect, decides the colour at the lower edge.
 *    The original's two modes painted either a dark ground or an opaque white.
 *  - No WebGL2, no aurora: the surface simply shows through.
 */

const VERT = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
uniform float uStrength;

out vec4 fragColor;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 ramp(float f) {
  if (f < 0.5) return mix(uColorStops[0], uColorStops[1], f / 0.5);
  return mix(uColorStops[1], uColorStops[2], (f - 0.5) / 0.5);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 color = ramp(uv.x);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float alpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  float energy = clamp(intensity, 0.0, 1.0);
  float coverage = clamp(alpha * (0.5 + 0.5 * energy), 0.0, 1.0) * uStrength;

  // Premultiplied: a tint of the ramp colour over whatever is behind.
  fragColor = vec4(color * coverage, coverage);
}
`;

type AuroraProps = {
  /** Three colours across the width, left to right. */
  colorStops: [string, string, string];
  amplitude?: number;
  blend?: number;
  speed?: number;
  /** Peak opacity of the tint, 0–1. */
  strength?: number;
  className?: string;
};

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // The aurora is decoration: fail quietly for visitors, loudly for us.
    if (process.env.NODE_ENV !== "production") console.warn("Aurora shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function Aurora({
  colorStops,
  amplitude = 1,
  blend = 0.5,
  speed = 1,
  strength = 0.85,
  className,
}: AuroraProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const [c0, c1, c2] = colorStops;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (process.env.NODE_ENV !== "production") console.warn("Aurora program:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // One triangle that covers the whole viewport.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "uTime");
    const uResolution = gl.getUniformLocation(program, "uResolution");
    gl.uniform1f(gl.getUniformLocation(program, "uAmplitude"), amplitude);
    gl.uniform1f(gl.getUniformLocation(program, "uBlend"), blend);
    gl.uniform1f(gl.getUniformLocation(program, "uStrength"), strength);
    gl.uniform3fv(gl.getUniformLocation(program, "uColorStops"), [c0, c1, c2].flatMap(hexToRgb));

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    canvas.className = "aurora-canvas";
    container.appendChild(canvas);

    const SCALE = 0.5;
    const resize = () => {
      const w = Math.max(1, Math.round(container.clientWidth * SCALE));
      const h = Math.max(1, Math.round(container.clientHeight * SCALE));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    };

    const draw = (ms: number) => {
      gl.uniform1f(uTime, ms * 0.001 * speed);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let raf = 0;
    let running = false;
    const loop = (ms: number) => {
      draw(ms);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (!running) draw(performance.now());
    });
    ro.observe(container);
    resize();
    draw(performance.now());

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(container);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [c0, c1, c2, amplitude, blend, speed, strength, reduced]);

  return <div ref={containerRef} className={["aurora", className].filter(Boolean).join(" ")} aria-hidden="true" />;
}
