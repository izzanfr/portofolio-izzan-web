/**
 * three ships no types of its own at this version, and this project calls
 * nothing on it — the whole module namespace is handed straight to Vanta, which
 * owns every three API in play. `@types/three` would be a couple of megabytes of
 * declarations for a namespace nothing here dereferences, so the module is left
 * deliberately untyped instead. Anything that starts using three directly should
 * install the real types and delete this file.
 */
declare module "three";
