// John Napoleon Cortes  ITE18 - AD1
import * as THREE from "three";
import Starfield from "./mods/Starfield.js";
import RAPIER from '@dimforge/rapier3d-compat';
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import testVertexShader from './shaders/test/vertex.glsl?raw';
import testFragmentShader from './shaders/test/fragments.glsl?raw';

// Initailization
// ----------------------------------------------------------------
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const canvas = document.querySelector('canvas.webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);

renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, .1, 1000);
camera.position.set(1, 0, 4);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);

const hemiLight = new THREE.HemisphereLight(0x00bbff, 0xaa00ff);
hemiLight.intensity = 0.2;
scene.add(hemiLight);

let mousePos = new THREE.Vector2();
await RAPIER.init();
const gravity = { x: 0.0, y: 0.0, z: 0.0 };
const world = new RAPIER.World(gravity);
// ----------------------------------------------------------------


// Create Ico Objects
// ----------------------------------------------------------------
const sceneMiddle = new THREE.Vector3(0, 0, 0);

function getBody(RAPIER, world) {
  const size = 0.1 + Math.random() * 0.25;
  const range = 6;
  const density = size * 1.0;
  let x = Math.random() * range - range * 0.5;
  let y = Math.random() * range - range * 0.5 + 3;
  let z = Math.random() * range - range * 0.5;

  // physics
  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, y, z);
  let rigid = world.createRigidBody(rigidBodyDesc);
  let colliderDesc = RAPIER.ColliderDesc.ball(size).setDensity(density);
  world.createCollider(colliderDesc, rigid);

  const geometry = new THREE.IcosahedronGeometry(size, 1);
  const shadermaterial = new THREE.ShaderMaterial({
    vertexShader: testVertexShader,
    fragmentShader: testFragmentShader,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, shadermaterial);

  const wireMat = new THREE.MeshBasicMaterial({ color: 0xf2d02f, wireframe: true });
  const wireMesh = new THREE.Mesh(geometry, wireMat);
  mesh.add(wireMesh);

  function update() {
    rigid.resetForces(true);
    let { x, y, z } = rigid.translation();
    let pos = new THREE.Vector3(x, y, z);
    let dir = pos.clone().sub(sceneMiddle).normalize();
    rigid.addForce(dir.multiplyScalar(-0.5), true);
    mesh.position.set(x, y, z);
  }
  return { mesh, rigid, update };
}

const numBodies = 100;
const bodies = [];
for (let i = 0; i < numBodies; i++) {
  const body = getBody(RAPIER, world);
  bodies.push(body);
  scene.add(body.mesh);
}
// ----------------------------------------------------------------


// Mouse Ball Object
// ----------------------------------------------------------------
function getMouseBall(RAPIER, world) {
  const mouseSize = 0.25;
  const geometry = new THREE.IcosahedronGeometry(mouseSize, 4);
  const material = new THREE.MeshStandardMaterial({
    color: 0x0da2ff,
    emissive: 0xffffff,
    flatShading: true,
  });
  const mouseLight = new THREE.PointLight(0xf2d02f, .5);
  const mouseMesh = new THREE.Mesh(geometry, material);
  mouseMesh.add(mouseLight);
  // Rigid Body
  let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0)
  let mouseRigid = world.createRigidBody(bodyDesc);
  let dynamicCollider = RAPIER.ColliderDesc.ball(mouseSize * 3.0);
  world.createCollider(dynamicCollider, mouseRigid);
  function update(mousePos) {
    mouseRigid.setTranslation({ x: mousePos.x * 5, y: mousePos.y * 5, z: 0.0 });
    let { x, y, z } = mouseRigid.translation();
    mouseMesh.position.set(x, y, z);
  }
  return { mesh: mouseMesh, update };
}

const mouseBall = getMouseBall(RAPIER, world);
scene.add(mouseBall.mesh);
// ----------------------------------------------------------------


// Event Listeners
// ----------------------------------------------------------------
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


window.addEventListener('mousemove', (event) => {
  mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
});
// ----------------------------------------------------------------


// Background 
const stars = Starfield({ numStars: 10000 });
scene.add(stars);


// Post-processing
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 1.5, 0.0, 0.305);
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);


const tick = () => {
  controls.update();
  world.step();
  mouseBall.update(mousePos);
  bodies.forEach(b => b.update());

  stars.rotation.y += 0.0003;
  stars.rotation.x += 0.0003;
  stars.rotation.z += 0.0003;

  // Render with Bloom
  composer.render(scene, camera);
  window.requestAnimationFrame(tick);
};
tick();




