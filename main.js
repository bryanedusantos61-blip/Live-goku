import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d1c);
scene.fog = new THREE.Fog(0x080d1c, 18, 55);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 7.5, 16);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xa9caff, 0x21152f, 2));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(-5, 12, 8); key.castShadow = true; scene.add(key);
const purpleLight = new THREE.PointLight(0x9c38ff, 35, 18);
purpleLight.position.set(5, 4, -2); scene.add(purpleLight);
const blueLight = new THREE.PointLight(0x168dff, 30, 18);
blueLight.position.set(-5, 4, 1); scene.add(blueLight);

const floor = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, .5, 64), new THREE.MeshStandardMaterial({color:0x202a43, metalness:.55, roughness:.45}));
floor.position.y = -.3; floor.receiveShadow = true; scene.add(floor);
const ring = new THREE.Mesh(new THREE.TorusGeometry(8.8,.08,8,100), new THREE.MeshBasicMaterial({color:0x69c9ff}));
ring.rotation.x = Math.PI/2; ring.position.y = -.02; scene.add(ring);
for(let i=0;i<16;i++){
  const a=i*Math.PI/8;
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,3,8),new THREE.MeshStandardMaterial({color:0x394766,metalness:.5,roughness:.4}));
  pillar.position.set(Math.cos(a)*10,1.2,Math.sin(a)*10); pillar.castShadow=true; scene.add(pillar);
}

function makeFighter({x, bodyColor, accent, hairColor, auraColor, dark=false}) {
  const group = new THREE.Group(); group.position.set(x,0,0); scene.add(group);
  const mat = c => new THREE.MeshStandardMaterial({color:c, roughness:.55, metalness:.12});
  const bodyMat=mat(bodyColor), accentMat=mat(accent), skinMat=mat(dark?0xaaa6bd:0xd9a47c), hairMat=mat(hairColor);
  function part(geo, material, pos, scale=[1,1,1]) {
    const m=new THREE.Mesh(geo,material); m.position.set(...pos); m.scale.set(...scale); m.castShadow=true; m.receiveShadow=true; group.add(m); return m;
  }
  const torso=part(new THREE.CapsuleGeometry(.48,.8,5,10),bodyMat,[0,1.65,0],[1,1,0.72]);
  part(new THREE.SphereGeometry(.34,20,16),skinMat,[0,2.65,0],[.9,1.08,.9]);
  // Stylized spiked hair / crown, deliberately original placeholder geometry.
  for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7;
    const spike=part(new THREE.ConeGeometry(.19,.68,7),hairMat,[Math.cos(a)*.22,3.05+((i%2)*.12),Math.sin(a)*.18]);
    spike.rotation.z=Math.cos(a)*-.45; spike.rotation.x=Math.sin(a)*.4;
  }
  part(new THREE.SphereGeometry(.13,12,10),hairMat,[0,3.05,0],[1,1.1,1]);
  const armL=part(new THREE.CapsuleGeometry(.14,.58,4,8),bodyMat,[-.62,1.85,0]); armL.rotation.z=-.45;
  const armR=part(new THREE.CapsuleGeometry(.14,.58,4,8),bodyMat,[.62,1.85,0]); armR.rotation.z=.45;
  part(new THREE.CapsuleGeometry(.19,.55,4,8),accentMat,[-.28,.65,0]);
  part(new THREE.CapsuleGeometry(.19,.55,4,8),accentMat,[.28,.65,0]);
  part(new THREE.BoxGeometry(.48,.16,.42),accentMat,[-.28,.12,.02]);
  part(new THREE.BoxGeometry(.48,.16,.42),accentMat,[.28,.12,.02]);
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1.65,24,18),new THREE.MeshBasicMaterial({color:auraColor,transparent:true,opacity:.12,side:THREE.BackSide}));
  aura.position.y=1.7; group.add(aura);
  const auraRing=new THREE.Mesh(new THREE.TorusGeometry(1.05,.035,8,64),new THREE.MeshBasicMaterial({color:auraColor,transparent:true,opacity:.75}));
  auraRing.rotation.x=Math.PI/2; auraRing.position.y=.08; group.add(auraRing);
  return {group,torso,armL,armR,aura,auraRing,baseX:x, hp:100, phase:Math.random()*6};
}
const goku=makeFighter({x:-3.2,bodyColor:0x1766d2,accent:0xffa33a,hairColor:0x202638,auraColor:0x39aaff});
const frieza=makeFighter({x:3.2,bodyColor:0x211b35,accent:0x9b42d8,hairColor:0x16131f,auraColor:0xb84cff,dark:true});
frieza.group.scale.setScalar(1.04);

const clock=new THREE.Clock();
let running=false, elapsed=0, attackClock=0, turn=0, dragging=false, lastX=0, cameraAngle=0;
const status=document.querySelector('#status');
const hp1=document.querySelector('#hp1'), hp2=document.querySelector('#hp2');
const hp1txt=document.querySelector('#hp1txt'), hp2txt=document.querySelector('#hp2txt');
const timer=document.querySelector('#timer');
function updateHud(){
  hp1.style.width=goku.hp+'%'; hp2.style.width=frieza.hp+'%';
  hp1txt.textContent=Math.ceil(goku.hp)+'%'; hp2txt.textContent=Math.ceil(frieza.hp)+'%';
  timer.textContent=new Date(elapsed*1000).toISOString().slice(14,19);
}
function attack(attacker, defender, name){
  if(!running || attacker.hp<=0 || defender.hp<=0)return;
  defender.hp=Math.max(0,defender.hp-(6+Math.random()*7));
  const dir=Math.sign(defender.group.position.x-attacker.group.position.x);
  attacker.group.position.x=attacker.baseX+dir*.35;
  attacker.armR.rotation.z=-1.4;
  status.textContent=name+'! O impacto acertou!';
  if(defender.hp<=0){running=false;status.textContent=(attacker===goku?'GOKU':'BLACK FREEZA')+' VENCEU A BATALHA!';}
  updateHud();
}
function reset(){
  goku.hp=frieza.hp=100; elapsed=0; attackClock=0; turn=0; running=false;
  goku.group.position.x=goku.baseX; frieza.group.position.x=frieza.baseX;
  status.textContent='Pronto. Toque em Iniciar batalha.'; updateHud();
}
document.querySelector('#start').onclick=()=>{if(goku.hp<=0||frieza.hp<=0)reset();running=true;status.textContent='BATALHA INICIADA!';};
document.querySelector('#pause').onclick=()=>{running=!running;status.textContent=running?'Batalha em andamento.':'Batalha pausada.';};
document.querySelector('#reset').onclick=reset;

// Camera drag controls (mouse + touch).
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;});
addEventListener('pointerup',()=>dragging=false);
addEventListener('pointermove',e=>{if(dragging){cameraAngle+=(e.clientX-lastX)*.005;lastX=e.clientX;}});
renderer.domElement.addEventListener('wheel',e=>{camera.position.z=THREE.MathUtils.clamp(camera.position.z+e.deltaY*.01,9,25);});

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime;
  goku.aura.scale.setScalar(1+Math.sin(t*4)*.06);
  frieza.aura.scale.setScalar(1+Math.sin(t*5+1)*.08);
  goku.auraRing.rotation.z=t*.8; frieza.auraRing.rotation.z=-t*.9;
  goku.group.position.y=Math.sin(t*2.5)*.08;
  frieza.group.position.y=Math.sin(t*2.8+1)*.08;
  goku.group.rotation.y=.16+Math.sin(t)*.04;
  frieza.group.rotation.y=-.16+Math.sin(t+1)*.04;
  if(running){
    elapsed+=dt; attackClock+=dt;
    if(attackClock>2.4){attackClock=0; if(turn%2===0)attack(goku,frieza,'GOLPE DO GOKU');else attack(frieza,goku,'RAJADA SOMBRIA');turn++;}
    updateHud();
  }
  camera.position.x=Math.sin(cameraAngle)*16;
  camera.position.z=Math.cos(cameraAngle)*16;
  camera.lookAt(0,1.3,0);
  renderer.render(scene,camera);
}
animate(); reset();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
