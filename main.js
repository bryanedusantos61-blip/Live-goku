import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b19);
scene.fog = new THREE.Fog(0x070b19, 22, 62);

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 6.8, 17);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xc7e5ff, 0x21122f, 2.0));

const key = new THREE.DirectionalLight(0xffffff, 3.1);
key.position.set(-7, 13, 9);
key.castShadow = true;
scene.add(key);

const rimBlue = new THREE.PointLight(0x2daaff, 42, 24);
rimBlue.position.set(-5, 4, 1);
scene.add(rimBlue);

const rimPurple = new THREE.PointLight(0xa52cff, 42, 24);
rimPurple.position.set(5, 4, -1);
scene.add(rimPurple);

const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(10, 10, .5, 80),
  new THREE.MeshStandardMaterial({
    color: 0x202a43,
    metalness: .55,
    roughness: .4
  })
);
floor.position.y = -.3;
floor.receiveShadow = true;
scene.add(floor);

const ring = new THREE.Mesh(
  new THREE.TorusGeometry(9, .075, 8, 120),
  new THREE.MeshBasicMaterial({ color: 0x54caff })
);
ring.rotation.x = Math.PI / 2;
ring.position.y = -.02;
scene.add(ring);

for (let i = 0; i < 18; i++) {
  const a = i * Math.PI * 2 / 18;
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(.13, .25, 3.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x34415f, metalness: .5 })
  );
  pillar.position.set(Math.cos(a) * 10, 1.4, Math.sin(a) * 10);
  pillar.castShadow = true;
  scene.add(pillar);
}

const mat = (c, metal = 0, rough = .48) =>
  new THREE.MeshStandardMaterial({
    color: c,
    metalness: metal,
    roughness: rough
  });

const sphere = new THREE.SphereGeometry(1, 24, 18);
const capsule = (r, len) =>
  new THREE.CapsuleGeometry(r, len, 8, 14);

function makeFighter(x, type) {
  const isGoku = type === 'goku';

  const root = new THREE.Group();
  root.position.x = x;
  scene.add(root);

  const skin = mat(isGoku ? 0xe9b58f : 0xc9c9e2);
  const suit = mat(isGoku ? 0x1260ce : 0x21172f);
  const darkSuit = mat(isGoku ? 0x0a367f : 0x100c1c);
  const accent = mat(isGoku ? 0xf29a32 : 0xa43de5, .25);
  const hair = mat(isGoku ? 0xeaf6ff : 0x100b19, .28, .3);
  const boot = mat(isGoku ? 0xd77b21 : 0x7e2bc8, .15);
  const metal = mat(isGoku ? 0x7de5ff : 0xd58aff, .6, .25);

  const add = (geo, material, pos, scale, parent = root) => {
    const o = new THREE.Mesh(geo, material);
    o.position.set(...pos);
    if (scale) o.scale.set(...scale);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };

  // Botas, pernas e roupas
  for (const s of [-1, 1]) {
    add(capsule(.19, .62), isGoku ? accent : suit,
      [s * .25, .63, 0]);

    add(new THREE.BoxGeometry(.43, .19, .64), boot,
      [s * .25, .16, .12]);

    add(new THREE.BoxGeometry(.44, .12, .47), darkSuit,
      [s * .25, .95, 0]);
  }

  add(capsule(.48, .76), suit, [0, 1.62, 0],
    [1, 1, .78]);

  add(new THREE.BoxGeometry(.91, .15, .78), accent,
    [0, 1.17, 0]);

  add(new THREE.BoxGeometry(.28, .17, .12), metal,
    [0, 1.17, .42]);

  // Rosto, pescoço e olhos
  add(capsule(.13, .18), skin, [0, 2.32, 0]);

  add(sphere, skin, [0, 2.65, 0],
    [.43, .5, .39]);

  for (const s of [-1, 1]) {
    add(sphere, skin, [s * .405, 2.67, 0],
      [.11, .16, .1]);

    add(sphere, mat(0xffffff),
      [s * .16, 2.68, .355],
      [.095, .055, .035]);

    add(sphere, mat(isGoku ? 0x1b2638 : 0x6e35a8),
      [s * .16, 2.68, .387],
      [.038, .05, .02]);

    add(sphere, mat(0x17121c),
      [s * .16, 2.77, .35],
      [.12, .035, .04]);
  }

  add(new THREE.ConeGeometry(.075, .17, 8),
    skin, [0, 2.57, .4], [1, 1, .8]);

  // Cabelo com várias pontas
  add(sphere, hair, [0, 3.02, -.015],
    [.45, .3, .4]);

  const spikeCount = isGoku ? 13 : 11;

  for (let i = 0; i < spikeCount; i++) {
    const a = i / spikeCount * Math.PI * 2;
    const h = (isGoku ? .52 : .43) + (i % 3) * .13;

    const spike = add(
      new THREE.ConeGeometry(isGoku ? .145 : .17, h, 7),
      hair,
      [Math.cos(a) * .28, 3.13 + (i % 2) * .04, Math.sin(a) * .22]
    );

    spike.rotation.z = -Math.cos(a) * .58 - (isGoku ? .12 : 0);
    spike.rotation.x = Math.sin(a) * .55;
}   // Detalhe especial do cabelo do Goku
  if (isGoku) {
    add(
      new THREE.ConeGeometry(.12, .42, 7),
      hair,
      [0, 3.36, .12]
    );
  } else {
    // Detalhes da coroa do Black Freeza
    add(
      new THREE.SphereGeometry(.13, 16, 12),
      metal,
      [0, 2.98, .39],
      [1, .7, .45]
    );

    add(
      new THREE.BoxGeometry(.56, .1, .08),
      darkSuit,
      [0, 2.91, .37]
    );
  }

  // Ombros, braços e luvas
  const arms = [];

  for (const s of [-1, 1]) {
    add(
      sphere,
      accent,
      [s * .52, 2.05, 0],
      [.28, .24, .3]
    );

    const upper = add(
      capsule(.145, .42),
      suit,
      [s * .66, 1.83, 0]
    );

    upper.rotation.z = s * -.28;

    const fore = add(
      capsule(.13, .39),
      isGoku ? skin : darkSuit,
      [s * .76, 1.47, .04]
    );

    fore.rotation.z = s * -.18;

    add(
      sphere,
      isGoku ? skin : accent,
      [s * .78, 1.22, .07],
      [.17, .14, .16]
    );

    add(
      new THREE.TorusGeometry(.14, .035, 8, 18),
      metal,
      [s * .76, 1.49, .04]
    );

    arms.push(upper, fore);
  }

  // Placas do peito
  add(
    new THREE.SphereGeometry(.19, 16, 12),
    accent,
    [0, 1.82, .365],
    [1.2, .72, .18]
  );

  for (let i = 0; i < 3; i++) {
    add(
      new THREE.BoxGeometry(.08, .28, .035),
      metal,
      [i * .1 - .1, 1.62, .41]
    );
  }

  // Aura e círculo de energia
  const auraMat = new THREE.MeshBasicMaterial({
    color: isGoku ? 0x69dfff : 0xa342ff,
    transparent: true,
    opacity: .12,
    side: THREE.BackSide
  });

  const aura = add(
    new THREE.SphereGeometry(1.45, 32, 24),
    auraMat,
    [0, 1.65, 0],
    [1, 1.15, .72]
  );

  const halo = add(
    new THREE.TorusGeometry(1.02, .035, 8, 72),
    new THREE.MeshBasicMaterial({
      color: isGoku ? 0x8beaff : 0xc879ff
    })
  );

  halo.rotation.x = Math.PI / 2;
  halo.position.y = .08;

  return {
    root,
    arms,
    aura,
    auraMat,
    halo,
    hp: 100,
    baseX: x,
    isGoku,
    transformed: false
  };
}

const goku = makeFighter(-3.25, 'goku');
const frieza = makeFighter(3.25, 'frieza');

const clock = new THREE.Clock();

let running = false;
let elapsed = 0;
let attackTimer = 0;
let turn = 0;
let camAngle = 0;
let dragging = false;
let lastX = 0;

let effects = [];
let particles = [];

const $ = selector => document.querySelector(selector);
const status = $('#status');

function updateHud() {
  $('#hp1').style.width = goku.hp + '%';
  $('#hp2').style.width = frieza.hp + '%';

  $('#hp1txt').textContent = Math.ceil(goku.hp) + '%';
  $('#hp2txt').textContent = Math.ceil(frieza.hp) + '%';

  $('#timer').textContent =
    new Date(elapsed * 1000).toISOString().slice(14, 19);
}

function feed(message) {
  const line = document.createElement('span');
  line.textContent = '› ' + message;

  $('#feed').prepend(line);

  while ($('#feed').children.length > 6) {
    $('#feed').lastChild.remove();
  }
}

function burst(position, color) {
  for (let i = 0; i < 30; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(.045, 7, 6),
      new THREE.MeshBasicMaterial({ color })
    );

    mesh.position.copy(position);
    scene.add(mesh);

    particles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - .5) * .2,
        Math.random() * .2,
        (Math.random() - .5) * .2
      ),
      life: 1
    });
  }
}

function beam(attacker, defender, color, label, damage = 12) {
  if (attacker.hp <= 0 || defender.hp <= 0) return;

  const start = new THREE.Vector3(
    attacker.root.position.x, 1.9, .15
  );

  const end = new THREE.Vector3(
    defender.root.position.x, 1.7, 0
  );

  const direction = end.clone().sub(start);
  const middle = start.clone().lerp(end, .5);

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      .13, .23, direction.length(), 14
    ),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: .95
    })
  );

  mesh.position.copy(middle);

  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );

  scene.add(mesh);
  effects.push({ mesh, life: .34 });

  burst(end, color);

  defender.hp = Math.max(0, defender.hp - damage);

  status.textContent = label + ' acertou!';
  feed(label + ' acertou!');

  if (defender.hp <= 0) {
    running = false;

    status.textContent =
      (attacker.isGoku ? 'GOKU' : 'BLACK FREEZA') + ' VENCEU!';

    feed(status.textContent);
  }

  updateHud();
}

function normalAttack() {
  const attacker = turn++ % 2 ? frieza : goku;

  beam(
    attacker,
    attacker === goku ? frieza : goku,
    attacker.isGoku ? 0x62dfff : 0xc05cff,
    attacker.isGoku ? 'Golpe de Goku' : 'Rajada de Black Freeza',
    7 + Math.random() * 6
  );
}
