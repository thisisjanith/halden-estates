// Three.js hero: a procedurally-built modern villa. Scroll orbits the camera around it
// while the day fades into dusk and the interior lights come on.
import * as THREE from "three";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

const DAY = { top: new THREE.Color("#8fb6d8"), hor: new THREE.Color("#e9eef0"), sun: new THREE.Color("#fff4e2") };
const DUSK = { top: new THREE.Color("#1b2440"), hor: new THREE.Color("#e79a6f"), sun: new THREE.Color("#ff9e6a") };

export function initVillaScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#e9eef0", 60, 190);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 600);

  const uni = { uTop: { value: DAY.top.clone() }, uHor: { value: DAY.hor.clone() }, uSun: { value: DAY.sun.clone() }, uSunDir: { value: new THREE.Vector3() }, uTime: { value: 0 }, uNight: { value: 0 } };
  scene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(400, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false, uniforms: uni,
        vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 uTop, uHor, uSun, uSunDir; varying vec3 vD;
          void main(){ float h = clamp(vD.y, 0.0, 1.0); vec3 c = mix(uHor, uTop, pow(h, 0.6));
            float s = max(dot(vD, normalize(uSunDir)), 0.0); c += uSun * (pow(s, 600.0) * 2.0 + pow(s, 12.0) * 0.35);
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      })
    )
  );

  // materials
  const M = {
    concrete: new THREE.MeshStandardMaterial({ color: "#efece6", roughness: 0.85 }),
    dark: new THREE.MeshStandardMaterial({ color: "#2a2c2b", roughness: 0.6 }),
    wood: new THREE.MeshStandardMaterial({ color: "#9a6a43", roughness: 0.7 }),
    deck: new THREE.MeshStandardMaterial({ color: "#b58d68", roughness: 0.8 }),
    stone: new THREE.MeshStandardMaterial({ color: "#c9c3b8", roughness: 0.95 }),
    grass: new THREE.MeshStandardMaterial({ color: "#7f9a63", roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: "#20303a", roughness: 0.08, metalness: 0.7, emissive: new THREE.Color("#e8964a"), emissiveIntensity: 0 }),
    leaf: new THREE.MeshStandardMaterial({ color: "#4f6b3f", roughness: 0.9, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: "#5b4636", roughness: 1 }),
  };
  const box = (w, h, d, mat, x, y, z, shadow = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };

  // ground & site
  const ground = new THREE.Mesh(new THREE.CircleGeometry(220, 64).rotateX(-Math.PI / 2), M.grass);
  ground.receiveShadow = true;
  scene.add(ground);
  box(40, 0.6, 26, M.stone, 0, 0.3, 0, false);       // plinth
  box(16, 0.2, 10, M.deck, 6, 0.7, 9, false);         // pool deck

  // pool water (animated)
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 5.2).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uTime, uNight; varying vec2 vUv;
        void main(){
          vec2 p = vUv * vec2(12.0, 5.2);
          float c = sin(p.x * 3.1 + uTime * 1.3) * sin(p.y * 3.7 - uTime * 1.1) + sin((p.x + p.y) * 2.3 + uTime * 0.9);
          float caustic = smoothstep(0.9, 1.6, c);
          vec3 day = mix(vec3(0.27, 0.7, 0.8), vec3(0.75, 0.95, 1.0), caustic * 0.6);
          vec3 night = mix(vec3(0.05, 0.45, 0.65), vec3(0.4, 0.9, 1.0), caustic * 0.7);
          gl_FragColor = vec4(mix(day, night, uNight), 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    })
  );
  water.position.set(6, 0.82, 9.6);
  scene.add(water);
  box(12.4, 0.12, 0.25, M.concrete, 6, 0.86, 7, false);
  box(12.4, 0.12, 0.25, M.concrete, 6, 0.86, 12.2, false);

  // ground floor: glass pavilion between concrete walls
  box(0.6, 4, 9, M.concrete, -10, 2.6, 0);
  box(0.6, 4, 9, M.concrete, 8, 2.6, 0);
  box(18.6, 4, 0.4, M.concrete, -1, 2.6, -4.3);
  box(17.4, 3.8, 0.12, M.glass, -1, 2.5, 4.4, false);   // front glazing
  for (let x = -7; x <= 5; x += 3) box(0.12, 3.8, 0.2, M.dark, x, 2.5, 4.45, false); // mullions
  box(19.4, 0.45, 10, M.dark, -1, 4.8, 0);               // floor slab
  // upper floor: cantilevered box clad in timber
  box(15, 3.6, 8.5, M.concrete, 1.5, 6.8, -0.8);
  box(15.04, 1.0, 8.54, M.wood, 1.5, 8.2, -0.8, false);
  box(10, 2.2, 0.12, M.glass, 3.5, 6.6, 3.5, false);
  box(0.12, 2.2, 6, M.glass, 9.05, 6.6, -0.5, false);
  box(16.6, 0.35, 10, M.dark, 1.5, 8.9, -0.6);           // roof overhang
  box(5, 0.9, 5, M.concrete, -6, 9.5, -1.5);             // roof stair core
  // side garage block
  box(7, 3.2, 8, M.wood, -15, 2.2, -0.5);
  box(7.4, 0.3, 8.4, M.dark, -15, 3.9, -0.5);
  // steps
  for (let i = 0; i < 3; i++) box(4, 0.2, 1, M.stone, -3, 0.1 + i * 0.2, 13.8 - i, false);

  // trees
  const tree = (x, z, s = 1) => {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.25 * s, 3 * s, 6), M.trunk);
    t.position.y = 1.5 * s;
    t.castShadow = true;
    g.add(t);
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry((1.6 - i * 0.3) * s, 0), M.leaf);
      f.position.set((Math.random() - 0.5) * s, (3 + i * 1.1) * s, (Math.random() - 0.5) * s);
      f.castShadow = true;
      g.add(f);
    }
    g.position.set(x, 0.6, z);
    scene.add(g);
  };
  [[-26, -4, 1.4], [-24, -14, 1.6], [16, -9, 1.4], [23, -2, 1.1], [-8, -14, 1.8], [8, -16, 1.5], [32, -10, 1.3], [-34, 4, 1.2], [-4, -22, 2]].forEach(([x, z, s]) => tree(x, z, s));
  // hedges
  box(1.2, 1, 12, M.leaf, 19, 1.1, 8);
  box(1.2, 1, 12, M.leaf, -19, 1.1, 8);

  // lights
  const hemi = new THREE.HemisphereLight("#e9eef0", "#6b7a55", 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff4e2", 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);
  const interior = [[-5, 2.5, 1], [2, 2.5, 1], [4, 6.6, 1.5]].map(([x, y, z]) => {
    const l = new THREE.PointLight("#ffb866", 0, 22, 1.6);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  });
  const poolLight = new THREE.PointLight("#5fd4ff", 0, 14, 2);
  poolLight.position.set(6, 1.2, 9.6);
  scene.add(poolLight);

  // camera orbit
  const center = new THREE.Vector3(0, 3.2, 1);
  let target = 0, prog = 0;
  const mouse = { x: 0, tx: 0 };
  addEventListener("pointermove", (e) => (mouse.tx = e.clientX / innerWidth - 0.5));

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 55 : 35;
    if (w / h > 1.1) camera.setViewOffset(w, h, -w * 0.2, h * 0.04, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.14, w, h);
    camera.updateProjectionMatrix();
  };
  addEventListener("resize", resize);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  const clock = new THREE.Clock();
  const sunDir = new THREE.Vector3();

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    uni.uTime.value += dt;
    prog += (target - prog) * (1 - Math.pow(0.003, dt));
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    const p = smooth(clamp(prog));
    const night = smooth(clamp((prog - 0.25) / 0.65));
    uni.uNight.value = night;

    uni.uTop.value.copy(DAY.top).lerp(DUSK.top, night);
    uni.uHor.value.copy(DAY.hor).lerp(DUSK.hor, night);
    uni.uSun.value.copy(DAY.sun).lerp(DUSK.sun, night);
    scene.fog.color.copy(uni.uHor.value);
    const sunEl = THREE.MathUtils.lerp(0.9, 0.08, night);
    const sunAz = THREE.MathUtils.lerp(0.6, -0.9, night);
    sunDir.set(Math.cos(sunAz) * Math.cos(sunEl), Math.sin(sunEl), Math.sin(sunAz) * Math.cos(sunEl)).normalize();
    uni.uSunDir.value.copy(sunDir);
    sun.position.copy(sunDir).multiplyScalar(80);
    sun.color.copy(uni.uSun.value);
    sun.intensity = THREE.MathUtils.lerp(2.6, 0.9, night);
    hemi.intensity = THREE.MathUtils.lerp(1.1, 0.35, night);
    hemi.color.copy(uni.uHor.value);
    M.glass.emissiveIntensity = night * 0.75;
    interior.forEach((l) => (l.intensity = night * 60));
    poolLight.intensity = night * 40;
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1, 1.15, night);

    // orbit: front-left high -> front-right -> pool side low
    const ang = THREE.MathUtils.lerp(-0.5, 0.95, p) + mouse.x * 0.12 + Math.sin(uni.uTime.value * 0.1) * 0.03;
    const rad = THREE.MathUtils.lerp(46, 34, p);
    const hgt = THREE.MathUtils.lerp(17, 6.5, p);
    camera.position.set(center.x + Math.sin(ang) * rad, hgt, center.z + Math.cos(ang) * rad);
    camera.lookAt(center);
    renderer.render(scene, camera);
  });

  return { setProgress: (v) => (target = clamp(v)) };
}
