// Props shared by the interiors: a generic grey handheld console (no lettering, no logo), a link cable, a desk lamp
import * as THREE from 'three';
import { PX, ramp, hex, h2, texOf, glow } from './px.js';

// Face texture, 40×64 px: grey shell, dark bezel with the screen window, cross pad, two round buttons, two pills, speaker slots
function faceCanvas(seed = 1) {
  const P = new PX(40, 64), G = ramp(['#6c6c74', '#8e8e96', '#adadb4', '#c8c8ce', '#dcdce0'], .4), D = ramp(['#22222a', '#34343e', '#4a4a56']), Bt = ramp(['#262a3a', '#3a4058', '#5a6284']);
  P.fill((x, y) => {
    let v = .62 - y * .002 + (h2(x, y, seed) - .5) * .06; if (x === 0 || y === 0) v += .2; if (x === 39 || y === 63) v -= .3;
    // bezel
    if (x >= 4 && x <= 35 && y >= 4 && y <= 30) { if (y === 4 || x === 4) return D(.8, x, y); return D(.3, x, y); }
    // cross pad
    const cx = 11, cy = 41; if ((Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 5) || (Math.abs(y - cy) <= 1 && Math.abs(x - cx) <= 5)) return D(x === cx - 5 || y === cy - 5 ? .9 : .45, x, y);
    // two round buttons
    for (const [bx, by] of [[27, 42], [33, 39]]) { const d = Math.hypot(x - bx, y - by); if (d < 2.8) return Bt(d < 1.2 && x < bx ? .95 : .5, x, y); }
    // pills
    for (const px of [15, 22]) if (y >= 51 && y <= 52 && x >= px && x <= px + 3) return D(.6, x, y);
    // speaker slots
    if (x > 26 && x < 37 && y > 54 && y < 61 && (x + y) % 3 === 0) return D(.2, x, y);
    return G(v, x, y);
  });
  return P.done();
}
// A handheld lying flat (screen up). Local axes: x across (w), z along (length, top edge at -z), y up.
export function handheld(L, o = {}) {
  const w = o.w ?? .16, len = w * 1.6, th = w * .19, g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: '#a8a8b0', roughness: .7 });
  const face = new THREE.MeshStandardMaterial({ map: texOf(faceCanvas(o.seed ?? 1)), roughness: .65 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, th, len), [shell, shell, face, shell, shell, shell]);
  body.position.y = th / 2; body.castShadow = body.receiveShadow = true; g.add(body);
  // screen: the 4-shade LCD, lit (emissive) when on
  const sw = w * 28 / 40, sh = sw * 144 / 160;
  const scrM = new THREE.MeshStandardMaterial({ color: '#3a4a30', emissive: '#ffffff', emissiveMap: L.tex, emissiveIntensity: 0, roughness: .3, map: L.tex });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), scrM); scr.rotation.x = -Math.PI / 2;
  scr.position.set(0, th + .001, -len / 2 + len * 17 / 64); g.add(scr);
  // link port on the top edge
  const port = new THREE.Mesh(new THREE.BoxGeometry(w * .22, th * .5, w * .06), new THREE.MeshStandardMaterial({ color: '#2a2a30', roughness: .8 }));
  port.position.set(w * .25, th * .55, -len / 2 - w * .02); g.add(port);
  const light = glow('#bfe89a', w * 2.2, 0); light.position.set(0, th + .02, scr.position.z); g.add(light);
  g.userData = { scr, scrM, light, port: new THREE.Vector3(w * .25, th * .55, -len / 2 - w * .04), len, th, w,
    on(k) { scrM.emissiveIntensity = k * .75; scrM.color.set(k > .02 ? '#202020' : '#3a4a30'); light.material.color.set('#bfe89a').multiplyScalar(k * .28); } };
  g.userData.on(0);
  return g;
}
// Link cable between two world points, sagging between them; returns { mesh, curve }
export function cable(a, b, sag = .1, r = .006) {
  const mid = a.clone().lerp(b, .5); mid.y += sag; const pa = a.clone(), pb = b.clone();
  const c1 = a.clone().lerp(mid, .5); c1.z -= .06; const c2 = b.clone().lerp(mid, .5); c2.z -= .06;
  const curve = new THREE.CatmullRomCurve3([pa, c1, mid, c2, pb]);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, r, 6), new THREE.MeshStandardMaterial({ color: '#3a3a42', roughness: .55 }));
  mesh.castShadow = true; return { mesh, curve };
}
