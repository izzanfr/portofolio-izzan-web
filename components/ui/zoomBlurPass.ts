/**
 * Cinematic zoom blur — a radial smear that resolves as you arrive.
 *
 * The shader is the glfx.js zoom blur: for each pixel it walks a short line
 * toward (or away from) a centre point, samples the source along the way and
 * averages, weighted so the middle of the walk counts most. `strength` is how
 * far that walk goes, so 0 is a straight copy and -1 is a full outward streak.
 * Alpha scales with it too, which is what makes the smear also a dissolve: the
 * ground fades up as it comes into focus, rather than doing the two separately.
 *
 * The interesting part is what it runs on. Vanta owns its renderer, its scene
 * and its animation loop, and it draws straight to the canvas — so there is no
 * hook to post-process through. Rather than run a second WebGL context and copy
 * a canvas into a texture every frame (which is the expensive way to do this),
 * this borrows Vanta's own renderer: `render` is wrapped so the lattice is
 * drawn into a render target first, and a full-screen quad carrying the shader
 * is drawn to the canvas in its place.
 *
 * The wrap is a pass-through whenever the blur has resolved — below the
 * threshold the pass costs a comparison and Vanta draws exactly as it did
 * before. So the sixteen taps per pixel are only paid during the handover
 * itself, which is the second or so you are actually scrolling through it.
 *
 * The centre follows the pointer, eased. That is what stops the effect reading
 * as a filter applied to a picture: the smear radiates from where you are
 * looking, so it belongs to the room rather than to the image of it.
 */

/* The slice of three's surface this pass touches. Written structurally, and
   written here, because three itself is deliberately left untyped (see
   types/three.d.ts) — this is the contract the pass depends on, declared where
   it is depended on rather than as a guess at the whole library. */
type Vec2 = {
  x: number;
  y: number;
  set(x: number, y: number): Vec2;
  lerp(v: Vec2, alpha: number): Vec2;
};

type Disposable = { dispose(): void };

type RenderTarget = Disposable & {
  texture: unknown;
  width: number;
  height: number;
  setSize(width: number, height: number): void;
};

export type ZoomBlurRenderer = {
  domElement: HTMLCanvasElement;
  render(scene: unknown, camera: unknown): void;
  setRenderTarget(target: RenderTarget | null): void;
  getDrawingBufferSize(target: Vec2): Vec2;
};

export type ZoomBlurThree = {
  Vector2: new (x?: number, y?: number) => Vec2;
  Scene: new () => { add(object: unknown): void };
  Mesh: new (geometry: unknown, material: unknown) => unknown;
  PlaneGeometry: new (width?: number, height?: number) => Disposable;
  OrthographicCamera: new (
    left: number,
    right: number,
    top: number,
    bottom: number,
    near?: number,
    far?: number,
  ) => unknown;
  ShaderMaterial: new (params: Record<string, unknown>) => Disposable;
  WebGLRenderTarget: new (width: number, height: number) => RenderTarget;
};

export type ZoomBlurPass = {
  /** -1 is fully smeared and invisible; 0 is sharp and solid. */
  setStrength: (value: number) => void;
  dispose: () => void;
};

/**
 * Sixteen, not the reference's twenty. The taps are the whole cost of the
 * effect and the difference between the two is not visible on a line lattice —
 * the randomised start offset below is what actually hides the sample count,
 * by giving every pixel a different phase so the steps never line up into
 * visible bands.
 */
const SAMPLES = 16;

/** Below this the walk is shorter than a pixel, so there is nothing to smear
 *  and the pass steps out of the way entirely. */
const BYPASS = 0.002;

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Adapted from https://github.com/evanw/glfx.js via the reference pen.
 *
 * Two changes. The reference carries uvScale/uvOffset to cover-fit a photo into
 * the viewport; the source here is a render target that is already exactly the
 * viewport, so that is dropped. And the last line keeps the sampled alpha
 * instead of replacing it — the reference cross-fades opaque photographs, where
 * overwriting alpha is the cross-fade, but this lattice is transparent by
 * design and must stay that way or the quad would paint a solid rectangle over
 * the washes underneath it.
 */
const FRAGMENT_SHADER = `
  uniform sampler2D map;
  uniform vec2 center;
  uniform float strength;
  varying vec2 vUv;

  /* Fragment position as the seed, so every pixel starts its walk at a
     different phase and the fixed sample count stops being visible. */
  float random(vec3 scale, float seed) {
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
  }

  void main() {
    vec2 toCenter = center - vUv;
    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);

    vec4 sum = vec4(0.0);
    float total = 0.0;

    for (float t = 0.0; t < ${SAMPLES}.0; t++) {
      float percent = (t + offset) / ${SAMPLES}.0;
      /* Peaks in the middle of the walk and falls off at both ends, so the
         streak fades out rather than stopping at a hard edge. */
      float weight = 2.0 * (percent - percent * percent);
      vec4 texel = texture2D(map, vUv + toCenter * percent * strength);
      /* Premultiply before averaging: blending straight alpha would drag the
         colour of transparent texels into the result as black. */
      texel.rgb *= texel.a;
      sum += texel * weight;
      total += weight;
    }

    vec4 blurred = sum / total;
    gl_FragColor = vec4(
      blurred.rgb / (blurred.a + 0.00001),
      blurred.a * (1.0 - abs(strength))
    );
  }
`;

export function installZoomBlurPass(
  renderer: ZoomBlurRenderer,
  three: ZoomBlurThree,
): ZoomBlurPass | null {
  try {
    const target = new three.WebGLRenderTarget(1, 1);

    const uniforms = {
      map: { value: target.texture },
      center: { value: new three.Vector2(0.5, 0.6) },
      // Starts fully smeared and invisible, so the first frame after the
      // lattice is created shows nothing rather than flashing in sharp.
      strength: { value: -1 },
    };

    const material = new three.ShaderMaterial({
      transparent: true,
      // The quad is alone in its scene and always covers it; depth testing it
      // against nothing only risks it being clipped by a stale buffer.
      depthTest: false,
      depthWrite: false,
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });

    const geometry = new three.PlaneGeometry(1, 1);
    const scene = new three.Scene();
    scene.add(new three.Mesh(geometry, material));
    // The standard full-screen quad framing: a unit box around the origin, with
    // the near plane behind it so the plane at z = 0 cannot fall outside it.
    const camera = new three.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 1);

    /* Where the smear radiates from. Texture space, so y counts up from the
       bottom — the opposite of a pointer event's y. */
    const pointer = new three.Vector2(0.5, 0.6);
    const onPointerMove = (event: PointerEvent) => {
      const box = renderer.domElement.getBoundingClientRect();
      if (!box.width || !box.height) return;
      pointer.set(
        (event.clientX - box.left) / box.width,
        1 - (event.clientY - box.top) / box.height,
      );
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const drawingBuffer = new three.Vector2();

    /* three assigns `render` as an own property in the WebGLRenderer
       constructor — a closure, not a prototype method — so restoring it means
       putting this exact function back. Deleting the own property would leave
       `renderer.render` undefined and take the lattice down with it. */
    const original = renderer.render;

    renderer.render = function patched(this: ZoomBlurRenderer, sourceScene, sourceCamera) {
      if (Math.abs(uniforms.strength.value) < BYPASS) {
        original.call(this, sourceScene, sourceCamera);
        return;
      }

      try {
        // Vanta resizes its own renderer; matching the target here rather than
        // hooking that keeps the pass from depending on when it happens.
        renderer.getDrawingBufferSize(drawingBuffer);
        if (target.width !== drawingBuffer.x || target.height !== drawingBuffer.y) {
          target.setSize(drawingBuffer.x, drawingBuffer.y);
        }

        // Eased rather than snapped: the centre trailing the cursor is what
        // makes the smear feel like it has weight.
        uniforms.center.value.lerp(pointer, 0.1);

        renderer.setRenderTarget(target);
        original.call(this, sourceScene, sourceCamera);
        renderer.setRenderTarget(null);
        original.call(this, scene, camera);
      } catch {
        /* This runs inside Vanta's animation loop, so a throw here does not
           fail once — it fails sixty times a second, forever, and takes the
           lattice with it. A lost WebGL context is the realistic way in. Stand
           the pass down permanently and let Vanta draw as it always did: the
           handover loses its blur, which is worth strictly more than the
           section losing its ground. */
        renderer.render = original;
        renderer.setRenderTarget(null);
        original.call(this, sourceScene, sourceCamera);
      }
    };

    return {
      setStrength: (value) => {
        uniforms.strength.value = value;
      },
      dispose: () => {
        window.removeEventListener("pointermove", onPointerMove);
        renderer.render = original;
        target.dispose();
        material.dispose();
        geometry.dispose();
      },
    };
  } catch {
    // A pass that cannot be built is not worth taking the lattice down for:
    // Vanta keeps drawing as it always did, and the arrival falls back to the
    // canvas crossfade in VantaNet.
    return null;
  }
}
