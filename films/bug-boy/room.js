// Set 2: a small room, early 1990s, night. Desk lamp (warm practical), cold window light, two linked handhelds,
// the old green bug cage and straw hat on the shelf. Shots: desk (cable discovery, push + dive), eureka (creature pops out, face lit, rack focus to the cage).
import * as THREE from 'three';
import { texOf, glow, mulberry, h2, PX, ramp, woodPlanks, plaster, billboard } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles, flick } from './fx.js';
import { makeSitter, glowAtlas, sprite, COLORS } from './chars.js';
import { handheld, cable } from './props.js';
import { lcd, overworld, spr, BUG } from './screens.js';
import { clamp, seg, ss, eio, eo, lerp, track } from '/core/lib.js';
import { T } from './timeline.js';
import { concrete } from './art.js';

export function buildRoom() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0c1020');
  scene.fog = new THREE.FogExp2('#141a2c', .05);
  const R = mulberry(5);
  // —— shell ——
  const floorM = mat(woodPlanks(96, 96, { pw: 5, len: 40, seed: 3, cols: ['#2a1a12', '#46301e', '#62442a', '#7e5a38', '#9a7048'] }));
  const wallM = (() => { const P = new PX(96, 96), Rw = ramp(['#56524c', '#6a655d', '#7c766c', '#8e877b'], .5); P.fill((x, y) => { let v = .5 + ((x % 12) < 6 ? .08 : -.04) + (h2(x, y, 4) - .5) * .12; if (y > 70) v = y === 71 ? .95 : .25 + (x % 8 === 0 ? -.2 : 0); return Rw(v, x, y); }); return mat(P.done()); })();
  floorM.userData.tile = 96 / 44; wallM.userData.tile = 96 / 40;
  const fl = mesh(new THREE.BoxGeometry(7, .1, 5).translate(0, -.05, .8), floorM); scene.add(fl);
  const back = mesh(new THREE.BoxGeometry(7, 3.2, .12).translate(0, 1.6, -.82), wallM); scene.add(back);
  const left = mesh(new THREE.BoxGeometry(.12, 3.2, 5).translate(-2.6, 1.6, .8), wallM); scene.add(left);
  // rug
  { const P = new PX(48, 32), Rg = ramp(['#2a1e3a', '#3e2c56', '#5a4278', '#7a5c98']); P.fill((x, y) => { const b = x < 3 || y < 3 || x > 44 || y > 28; return Rg(b ? .85 : .35 + ((x >> 2) + (y >> 2)) % 2 * .15, x, y); }); const r = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: texOf(P.done()), roughness: 1 })); r.rotation.x = -Math.PI / 2; r.position.set(-.2, .005, .6); r.receiveShadow = true; scene.add(r); }
  // window with a night town outside (emissive pixels)
  { const P = new PX(64, 48), E = new PX(64, 48); P.fill((x, y) => { const sky = ramp(['#0a1028', '#142046', '#22305e'])(1 - y / 48, x, y); const bh = 18 + Math.floor(h2(x >> 3, 0, 4) * 18); if (y > 48 - bh) { const win = (x % 4 === 1) && (y % 5 === 2) && h2(x, y, 6) > .45; if (win) { E.set(x, y, [255, 196, 110]); return [255, 196, 110]; } return [16, 18, 30]; } if (h2(x, y, 9) > .992) { E.set(x, y, [200, 210, 255]); return [200, 210, 255]; } return sky; });
    const m = new THREE.MeshStandardMaterial({ map: texOf(P.done()), emissiveMap: texOf(E.done()), emissive: '#ffffff', emissiveIntensity: 1.4 });
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.05), m); w.position.set(-1.25, 1.55, -.755); scene.add(w);
    const fr = new THREE.MeshStandardMaterial({ color: '#d8d2c4', roughness: .8 });
    [[0, .55, 1.5, .06], [0, -.55, 1.5, .06], [-.72, 0, .06, 1.16], [.72, 0, .06, 1.16], [0, 0, .04, 1.1]].forEach(([x, y, ww, hh]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, .05), fr); b.position.set(-1.25 + x, 1.55 + y, -.74); scene.add(b); }); }
  // desk
  const deskM = mat(woodPlanks(96, 48, { pw: 12, len: 96, seed: 8, nails: false, cols: ['#3a2416', '#5a3a22', '#7a5230', '#966a40', '#b0824e'] }));
  deskM.userData.tile = 96 / 100;
  const DY = .72;
  scene.add(mesh(new THREE.BoxGeometry(1.9, .05, .95).translate(.75, DY - .025, -.2), deskM));
  for (const [x, z] of [[-.15, -.62], [1.65, -.62], [-.15, .22], [1.65, .22]]) scene.add(mesh(new THREE.BoxGeometry(.05, DY - .05, .05).translate(x, (DY - .05) / 2, z), deskM));
  scene.add(mesh(new THREE.BoxGeometry(.5, .5, .85).translate(1.35, .28, -.2), deskM));   // drawers
  // papers, a notebook with bug sketches, pencils
  const paper = (x, z, r, w = .21, d = .29, pic = 0) => { const P = new PX(21, 29); P.fill((i, j) => { if (pic && j > 4 && j < 22 && i > 3 && i < 18 && Math.hypot(i - 10.5, (j - 13) * .8) < 6 && (i + j) % 2) return [60, 60, 70]; if (j % 4 === 0 && i > 2 && i < 19 && !pic) return [150, 160, 180]; return [236, 230, 214]; }); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: texOf(P.done()), roughness: .9 })); m.rotation.set(-Math.PI / 2, 0, r); m.position.set(x, DY + .002, z); m.receiveShadow = true; scene.add(m); };
  paper(.15, -.45, .3, .21, .29, 1); paper(1.15, .0, -.2); paper(1.3, -.1, .15, .21, .29, 1);
  // shelf on the back wall: the bug cage and the straw hat from the countryside
  const shelfY = 1.42;
  scene.add(mesh(new THREE.BoxGeometry(1.5, .04, .26).translate(.45, shelfY, -.66), deskM));
  const cageP = new PX(20, 16); cageP.fill((x, y) => { const e = x === 0 || x === 19 || y === 0 || y === 15; if (e) return COLORS.cage(.85 - y * .03, x, y); if (y === 3) return COLORS.cage(.5, 0, 0); return x % 3 === 0 ? COLORS.cage(.4, x, y) : null; }); cageP.outline(.3);
  const cage = billboard(texOf(cageP.done()), .34, .27, { shadow: true }); cage.position.set(.12, shelfY + .02, -.62); scene.add(cage);
  const hatP = new PX(28, 12); hatP.fill((x, y) => { const u = (x - 13.5) / 13.5; if (y >= 8 && y <= 10 && Math.abs(u) < 1) return COLORS.straw(.6 - y * .03 + (Math.abs(u) > .8 ? -.2 : 0), x, y); if (y < 8 && Math.abs(x - 13.5) < 6 - (7 - y) * .3 && y > 1) return y === 6 ? COLORS.band(.5, 0, 0) : COLORS.straw(.7 - y * .02, x, y); return null; }); hatP.outline(.3);
  const hat = billboard(texOf(hatP.done()), .52, .22, { shadow: true }); hat.position.set(.62, shelfY + .02, -.64); scene.add(hat);
  [[.92, .2, '#6a2a2a'], [.99, .18, '#2a4a6a'], [1.05, .22, '#4a5a2a'], [1.11, .19, '#7a6a3a']].forEach(([x, h, c]) => scene.add(box(.05, h, .17, new THREE.MeshStandardMaterial({ color: c, roughness: .9 })).translateX(x).translateY(shelfY + .02).translateZ(-.66)));
  // desk lamp
  const lampM = new THREE.MeshStandardMaterial({ color: '#2a3a34', roughness: .5, metalness: .3 });
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, .03, 14), lampM); lampBase.position.set(1.42, DY + .015, -.42); scene.add(lampBase);
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .42), lampM); arm1.position.set(1.36, DY + .22, -.38); arm1.rotation.z = .35; scene.add(arm1);
  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .36), lampM); arm2.position.set(1.2, DY + .45, -.3); arm2.rotation.z = -1.0; scene.add(arm2);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(.1, .14, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#3a5a4a', side: THREE.DoubleSide, roughness: .5 })); shade.position.set(1.02, DY + .5, -.22); shade.rotation.z = .5; scene.add(shade);
  const bulbP = new THREE.Vector3(1.0, DY + .46, -.2);
  const lamp = new THREE.PointLight('#ffc27a', 1.25, 4.5, 1.6); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -.002; lamp.shadow.camera.near = .03; lamp.position.copy(bulbP); scene.add(lamp);
  const lampG = glow('#ffd08a', .22, 1.4); lampG.position.copy(bulbP); scene.add(lampG);
  // cold window light + dim fill
  const moon = new THREE.DirectionalLight('#7f9ad8', .9); moon.position.set(-3, 3.5, 2); moon.target.position.set(.4, .7, -.3); scene.add(moon, moon.target);
  const hemi = new THREE.HemisphereLight('#4a5a8a', '#1a1210', .42); scene.add(hemi);

  // —— the two handhelds and the cable ——
  const L1 = lcd(), L2 = lcd();
  const H1 = handheld(L1, { seed: 1 }), H2 = handheld(L2, { seed: 2 });
  H1.position.set(.16, DY, .1); H1.rotation.y = .1; H2.position.set(.56, DY, .12); H2.rotation.y = -.08; scene.add(H1, H2);
  scene.updateMatrixWorld(true);
  const p1 = H1.localToWorld(H1.userData.port.clone()), p2 = H2.localToWorld(H2.userData.port.clone());
  const curve = new THREE.CatmullRomCurve3([p1, p1.clone().add(new THREE.Vector3(.0, .0, -.1)), new THREE.Vector3((p1.x + p2.x) / 2, DY + .006, -.32), p2.clone().add(new THREE.Vector3(0, 0, -.1)), p2]);
  const cab = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, .0065, 6), new THREE.MeshStandardMaterial({ color: '#3c3c46', roughness: .5 })); cab.castShadow = true; scene.add(cab);
  for (const p of [p1, p2]) { const plug = new THREE.Mesh(new THREE.BoxGeometry(.03, .016, .03), new THREE.MeshStandardMaterial({ color: '#2a2a32' })); plug.position.copy(p).add(new THREE.Vector3(0, 0, -.012)); scene.add(plug); }
  const screenLight = new THREE.PointLight('#b6ea8a', 0, 1.6, 1.6); screenLight.position.set(.7, DY + .25, .3); scene.add(screenLight);

  // —— Satoshi at the desk ——
  const man = makeSitter('satoshi'); man.root.position.set(-.36, 0, -.02); scene.add(man.root);
  const front = new THREE.PointLight('#ffe2c0', 1.1, 3, 2); scene.add(front);

  // —— spark + creature ——
  const spark = glow('#eaffd0', .06, 2.0); scene.add(spark);
  const SP = [...Array(40)].map(() => [R(), R(), R(), R()]);
  let sparkOrigin = new THREE.Vector3(), sparkK = 0;
  const sparks = particles(SP.length, (i, t, o) => { const s = SP[i], a = s[0] * 6.28, r = .02 + s[1] * .08 * sparkK; o.x = sparkOrigin.x + Math.cos(a + t * 3) * r; o.y = sparkOrigin.y + s[2] * .08 * sparkK + .01; o.z = sparkOrigin.z + Math.sin(a + t * 3) * r; o.a = sparkK * (.5 + .5 * Math.sin(t * 20 + s[3] * 9)); o.s = .006; o.r = 1.8; o.g = 2.4; o.b = 1.6; }, { soft: 0 });
  scene.add(sparks);
  const GA = glowAtlas(); const crit = sprite(GA, 1 / 160, { name: 'glowbeetle', blob: false, emI: 2.4, cap: false }); scene.add(crit.root);
  const critG = glow('#7af0e0', .3, 1.2); scene.add(critG);
  const critLight = new THREE.PointLight('#7af0e0', 0, 1.8, 1.6); scene.add(critLight);
  const TR = [...Array(30)].map((_, i) => i);
  const trail = particles(TR.length, (i, t, o) => { const dt = i * .03, p = critPath(t - dt); o.x = p.x + Math.sin(i * 1.7) * .01; o.y = p.y + Math.cos(i * 2.3) * .01; o.z = p.z; o.a = critK(t - dt) * (1 - i / TR.length) * .9; o.s = .007; o.r = 1.4; o.g = 2.6; o.b = 2.4; }, { soft: 0 });
  scene.add(trail);
  // the creature leaves the second screen, circles up past Satoshi's face and settles on the old bug cage
  const scr2 = () => H2.localToWorld(H2.userData.scr.position.clone());
  const P0 = () => scr2().add(new THREE.Vector3(0, .02, 0));
  const critTrack = (() => { const s = P0(); return track([[T.popOut, [s.x, s.y, s.z]], [T.popOut + .5, [s.x - .05, s.y + .28, s.z + .02]], [T.popOut + 1.4, [.25, 1.25, .12]], [T.rack, [.18, 1.5, -.25]], [T.rack + 1.4, [.14, shelfY + .2, -.55]]]); })();
  function critPath(t) { return new THREE.Vector3(...critTrack(t)); }
  function critK(t) { return t < T.popOut ? 0 : 1; }

  // —— cameras ——
  const mid = curve.getPoint(.5);
  const C_desk = {
    p: track([[27.15, [mid.x - .05, mid.y + .28, mid.z + .22]], [28.6, [-.25, 2.5, 3.9]], [30.4, [.45, 1.3, .9]], [31.5, [mid.x, mid.y + .03, mid.z + .05]]]),
    l: track([[27.15, [mid.x, mid.y, mid.z]], [28.6, [-.12, .98, -.15]], [30.4, [mid.x, mid.y, mid.z - .02]], [31.5, [mid.x, mid.y, mid.z - .02]]]),
  };
  const s2 = scr2();
  const C_eur = {
    p: track([[34.6, [s2.x + .02, s2.y + .3, s2.z + .25]], [35.6, [-.25, 1.9, 2.8]], [37.2, [-.3, 1.85, 3.1]], [39.6, [-.05, 1.9, 2.3]]]),
    l: track([[34.6, [s2.x, s2.y + .05, s2.z]], [35.6, [-.2, 1.08, -.1]], [37.2, [-.2, 1.1, -.15]], [39.6, [.05, 1.38, -.55]]]),
  };
  const screenOn = (L, H, t, bugAt) => { overworld(L, t, { scroll: t * 6, bug: bugAt }); H.userData.on(1); };

  function update(t, shot, camera, post, renderer) {
    const id = shot.id;
    // screens: both on; screen 1 shows the bug walking toward the cable side, screen 2 receives it (eureka)
    screenOn(L1, H1, t, id === 'desk' && t < T.spark ? [100 + (t - 28) * 12, 60] : null);
    const bug2 = id === 'eureka' && t < T.popOut + .15 ? [40, 60] : null;
    screenOn(L2, H2, t + 3, bug2);
    const fk = flick(t * .3, 2) * .03 + .97;
    lamp.intensity = 1.25 * fk;
    // spark travels along the cable from screen 1 toward the middle, then the camera dives after it
    sparkK = id === 'desk' ? ss(seg(t, T.spark - .2, T.spark + .1)) : 0;
    const u = id === 'desk' ? .12 + .38 * ss(seg(t, T.spark, T.dive)) : 0;
    sparkOrigin.copy(curve.getPoint(u)); spark.position.copy(sparkOrigin).add(new THREE.Vector3(0, .012, 0));
    spark.visible = sparkK > 0; spark.scale.setScalar(.04 + .05 * sparkK * (1 + .3 * Math.sin(t * 30)));
    sparks.userData.update(t);
    // creature
    const cOn = id === 'eureka' && t >= T.popOut;
    crit.root.visible = critG.visible = cOn; critLight.intensity = cOn ? 1.6 : 0;
    if (cOn) { const p = critPath(t); crit.root.position.copy(p).add(new THREE.Vector3(0, -.03, 0)); crit.frame(['f0', 'f1', 'f2', 'f1'][Math.floor(t * 20) % 4]); crit.face(camera, p.x < critPath(t - .05).x); critG.position.copy(p); critLight.position.copy(p).add(new THREE.Vector3(0, .05, .15));
      const pop = 1 + 2.2 * Math.exp(-(t - T.popOut) / .12); critG.scale.setScalar(.28 * pop); }
    trail.visible = cOn; trail.userData.update(t);
    // Satoshi: leans in, eureka, smile
    let fr = 'sit0';
    if (id === 'desk') fr = t < 29.4 ? (Math.floor(t * 1.3) % 2 ? 'sit1' : 'sit0') : (Math.floor(t * 1.3) % 2 ? 'lean1' : 'lean');
    else fr = t < T.wow ? 'lean' : t < T.wow + 1.6 ? (Math.floor(t * 2) % 2 ? 'wowL' : 'wow') : (t % 2.8 < .12 ? 'blink' : 'smile');
    man.frame(fr); man.face(camera);
    front.position.set(-.1, 1.3, 1.1); front.intensity = .7;
    screenLight.intensity = 1.1 + (cOn ? .8 * Math.exp(-(t - T.popOut) / .6) : 0);
    // camera
    const C = id === 'desk' ? C_desk : C_eur;
    camera.position.set(...C.p(t)); camera.lookAt(...C.l(t)); camera.fov = id === 'desk' ? 34 : 36; camera.near = .01;
    // post
    renderer.toneMappingExposure = 1.15;
    const flash = id === 'desk' ? Math.exp(-Math.max(0, T.dive - t) / .12) * ss(seg(t, T.dive - .35, T.dive)) : 0;
    const pop = id === 'eureka' ? Math.exp(-Math.max(0, t - shot.a) / .18) : 0;
    renderer.toneMappingExposure = 1.15 * (1 + flash * 6 + pop * 5);
    post.bloom.strength = .7 + flash * 1.5 + pop; post.bloom.threshold = .78;
    const V = post.vig.uniforms; V.amt.value = .62; V.warm.value = .12; V.sat.value = 1.1;
    // focus: cable / hands; eureka: creature → face → rack to the cage
    let fp;
    if (id === 'desk') fp = t < 28.6 ? mid : t < 30.0 ? new THREE.Vector3(.4, 1.0, -.05) : sparkOrigin;
    else { const face = new THREE.Vector3(-.2, 1.25, -.02), cg = new THREE.Vector3(.12, shelfY + .15, -.62); fp = t < 35.5 ? critPath(t) : face.clone().lerp(cg, ss(seg(t, T.rack, T.rack + 1.0))); }
    post.dof.focus = camera.position.distanceTo(fp); post.dof.aper = id === 'desk' ? (t > 30.4 ? 6 : 30) : 28; post.dof.maxCoc = 20;
  }
  return { scene, update };
}
