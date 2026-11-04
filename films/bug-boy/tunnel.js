// Set 3: inside the link cable — the imagined journey. A pixel-lit tunnel of 4-shade green and teal light; the glow-beetle flies ahead,
// rings of light pop on as it passes, and the far end opens into the second screen (white flash back to the room).
import * as THREE from 'three';
import { mulberry } from './px.js';
import { particles } from './fx.js';
import { glowAtlas, sprite } from './chars.js';
import { clamp, seg, ss, eio, lerp } from '/core/lib.js';
import { T } from './timeline.js';

export function buildTunnel() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#02060a');
  const R = mulberry(3);
  const pts = []; for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector3(Math.sin(i * .7) * 1.2, Math.cos(i * .45) * .7, -i * 3));
  const curve = new THREE.CatmullRomCurve3(pts);
  const LEN = curve.getLength();
  const U = { t: { value: 0 }, head: { value: 0 }, len: { value: LEN }, k: { value: 1 } };
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 400, .55, 32, false), new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `varying vec2 vUv; uniform float t, head, len, k;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec2 g = floor(vec2(vUv.x * len * 10., vUv.y * 48.));             // pixel cells
        float s = vUv.x * len;                                           // distance along
        vec3 c0 = vec3(.015, .05, .04), c1 = vec3(.06, .2, .12), c2 = vec3(.24, .5, .18), c3 = vec3(.62, .82, .4), teal = vec3(.3, 1., .9);
        float n = h(g + floor(t * 6.) * .0);
        float tw = step(.86, h(g + floor(t * 8. + h(g) * 9.)));
        vec3 col = mix(c0, c1, step(.55, n));
        col = mix(col, c2, tw * .8);
        // ring bands every 1.2 m that light up as the creature passes, and stay lit
        float ring = smoothstep(.1, 0., abs(fract(s / 1.2) - .5) - .38);
        float lit = smoothstep(head + .6, head - .4, s);
        col += ring * mix(c1 * .6, teal * 1.1, lit);
        // little pixel glyphs drifting along the walls (bugs, trees) as tiny 3x3 marks
        vec2 cell = floor(vec2(s * 2.2 - t * 1.5, vUv.y * 16.)); vec2 f = fract(vec2(s * 2.2 - t * 1.5, vUv.y * 16.));
        float glyph = step(.93, h(cell)) * step(.25, f.x) * step(f.x, .75) * step(.25, f.y) * step(f.y, .75);
        col = mix(col, c3, glyph * .9);
        // glow near the creature
        col += teal * .5 * exp(-abs(s - head) * 1.4);
        gl_FragColor = vec4(col * k, 1.);
      }`,
  }));
  scene.add(tube);
  // exit light: the second screen at the far end
  const exitM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#d8f0b0').multiplyScalar(3), transparent: true });
  const exit = new THREE.Mesh(new THREE.CircleGeometry(.6, 32), exitM); scene.add(exit);
  const GA = glowAtlas(); const crit = sprite(GA, 1 / 90, { name: 'glowbeetle', blob: false, emI: 2.6, cap: false });
  crit.mesh.material = new THREE.MeshBasicMaterial({ map: GA.tex, alphaTest: .5, side: THREE.DoubleSide, color: new THREE.Color(1.6, 1.6, 1.6) });
  scene.add(crit.root);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ color: new THREE.Color('#6ff0dc').multiplyScalar(1.2), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })() }));
  scene.add(halo);
  const MO = [...Array(220)].map(() => [R(), R() * 6.28, .1 + R() * .4, R()]);
  let headS = 0;
  const motes = particles(MO.length, (i, t, o) => { const m = MO[i], s = (m[0] * LEN), p = curve.getPointAt(clamp(s / LEN, 0, 1)); o.x = p.x + Math.cos(m[1] + t) * m[2]; o.y = p.y + Math.sin(m[1] + t) * m[2]; o.z = p.z; o.a = .5 + .5 * Math.sin(t * 7 + m[3] * 20); o.s = .012; o.r = .7; o.g = 2.0; o.b = 1.5; }, { soft: 0 });
  scene.add(motes);
  const TRN = 40;
  const trail = particles(TRN, (i, t, o) => { const s = Math.max(0, headS - .05 - i * .045), p = curve.getPointAt(clamp(s / LEN, 0, 1)); o.x = p.x + Math.sin(i * 2.1 + t * 9) * .02 * i * .1; o.y = p.y - .04 + Math.cos(i * 1.3 + t * 7) * .02 * i * .1; o.z = p.z; o.a = (1 - i / TRN) * 1.2; o.s = .02 * (1 - i / TRN) + .006; o.r = 1.2; o.g = 2.6; o.b = 2.2; }, { soft: 1 });
  scene.add(trail);

  function update(t, shot, camera, post, renderer) {
    const u = seg(t, shot.a, shot.b), e = eio(u);
    const camS = lerp(.6, LEN - 4.2, e), headSn = camS + 1.35 + Math.sin(t * 3) * .08;
    headS = headSn; U.t.value = t; U.head.value = headS;
    const cp = curve.getPointAt(camS / LEN), look = curve.getPointAt(Math.min(1, (camS + 2) / LEN));
    camera.position.copy(cp).add(new THREE.Vector3(0, .12, 0)); camera.lookAt(look); camera.fov = 62 - 10 * Math.sin(u * Math.PI); camera.near = .02;
    const hp = curve.getPointAt(Math.min(1, headS / LEN));
    crit.root.position.copy(hp).add(new THREE.Vector3(Math.sin(t * 4) * .03, -.08 + Math.sin(t * 6) * .02, 0)); crit.frame(['f0', 'f1', 'f2', 'f1'][Math.floor(t * 22) % 4]); crit.face(camera);
    halo.position.copy(hp); halo.scale.setScalar(.45 + .05 * Math.sin(t * 9));
    const ep = curve.getPointAt(1), et = curve.getTangentAt(1); exit.position.copy(ep); exit.lookAt(ep.clone().sub(et)); exitM.opacity = 1;
    motes.userData.update(t); trail.userData.update(t);
    // entry flash decays, exit flash grows (hides the cuts)
    const fin = Math.exp(-(t - shot.a) / .16), fout = Math.pow(ss(seg(t, shot.b - .5, shot.b)), 2);
    renderer.toneMappingExposure = .95 * (1 + fin * 5 + fout * 7);
    post.bloom.strength = .7 + fout; post.bloom.threshold = .7; post.bloom.radius = .8;
    const V = post.vig.uniforms; V.amt.value = .7; V.warm.value = 0; V.sat.value = 1.15;
    post.dof.focus = camera.position.distanceTo(hp); post.dof.aper = 3; post.dof.maxCoc = 14;
  }
  return { scene, update };
}
