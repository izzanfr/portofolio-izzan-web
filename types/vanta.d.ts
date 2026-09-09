/**
 * Vanta ships no types, and the effects are only reachable through their built
 * files. Declared narrowly — the options this project actually passes, plus the
 * two methods it calls on the returned instance — rather than as `any`, so a
 * typo in an option name is still a compile error.
 */
declare module "vanta/dist/vanta.net.min" {
  export type VantaNetOptions = {
    el: HTMLElement;
    /** Vanta reads three off `window.THREE` unless it is handed one. */
    THREE: unknown;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    backgroundColor?: number;
    /** 0 leaves the canvas transparent, so layers behind it still show. */
    backgroundAlpha?: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
    showDots?: boolean;
  };

  export type VantaEffect = {
    /**
     * three's WebGLRenderer. Vanta creates and owns it; the zoom-blur pass
     * borrows it rather than standing up a second WebGL context. Left as
     * `unknown` because three is untyped here — the pass declares the shape it
     * needs and narrows at the one place it is handed over.
     */
    renderer: unknown;
    /**
     * The three Scene Vanta builds. Left `unknown` for the same reason as
     * `renderer`; VantaNet narrows it to walk the materials and repair the
     * invalid blending mode the NET effect ships with.
     */
    scene: unknown;
    setOptions: (options: Partial<VantaNetOptions>) => void;
    resize: () => void;
    destroy: () => void;
  };

  export default function NET(options: VantaNetOptions): VantaEffect;
}
