import * as THREE from './vendor/three.module.js';
import { VRButton } from './vendor/jsm/webxr/VRButton.js';
import { SimplexNoise } from './vendor/jsm/math/SimplexNoise.js';

const noise = new SimplexNoise()

let camera, scene, renderer, controller1, controller2;

let mesh;
const amount = parseInt(window.location.search.substr(1)) || 6;
const maxcount = 1000;
const dummy = new THREE.Object3D();

let worldOffset = new THREE.Vector3(0, 1, -2);
let worldScale = 0.25;

let scaleWorld = false;
let scaleStart = new THREE.Vector3();
let moveWorld = false;
let moveStart = new THREE.Vector3();

let locs = []
init();
animate()

function addMonkey(c) {
    if (mesh && mesh.count < maxcount) {
        locs.push({
            s: 0,
            x: c.position.x,
            y: c.position.y,
            z: c.position.z
        })
        c.locPressed = mesh.count
        mesh.count = mesh.count + 1
    }
    return true;
}

function removeMonkey() {
    if (mesh.count > 0) {
        locs.pop()
        mesh.count -= 1
    }
}
    

function init() {

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(amount * 0.9, amount * 0.9, amount * 0.9);

    scene = new THREE.Scene();


    const loader = new THREE.BufferGeometryLoader();
    loader.load('./suzanne_buffergeometry.json', function (geometry) {

        geometry.computeVertexNormals();
        geometry.scale(0.3, 0.3, 0.3);

        const material = new THREE.MeshNormalMaterial();

        mesh = new THREE.InstancedMesh(geometry, material, maxcount);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
        mesh.count = 0;
        scene.add(mesh);
    });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));

    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);


    controller1.addEventListener('selectstart', () => addMonkey(controller1));
    controller1.addEventListener('selectend', () => controller1.locPressed = false);
    controller1.addEventListener('squeezestart', removeMonkey);
    controller2.addEventListener('selectstart', () => addMonkey(controller2));
    controller2.addEventListener('selectend', () => controller2.locPressed = false);
    controller2.addEventListener('squeezestart', removeMonkey);

    window.addEventListener('resize', onWindowResize);
}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    const time = Date.now() * 0.001;

    if (mesh) {
        if (Number.isInteger(controller1.locPressed)) {
            locs[controller1.locPressed].s = Math.min(1, locs[controller1.locPressed].s + 0.01);
        }
        if (Number.isInteger(controller2.locPressed)) {
            locs[controller2.locPressed].s = Math.min(1, locs[controller2.locPressed].s + 0.01);
        }

        for (let i = 0; i < mesh.count; i++) {
            let {x,y,z,s} = locs[i]
            dummy.position.set(x,y,z)

            dummy.lookAt(controller1.position)
            dummy.rotation.x += 0.2*noise.noise4d(7*x, y, z, time * 0.2)
            dummy.rotation.y += 0.2*noise.noise4d(x, 3*y, z, time * 0.2)
            dummy.rotation.z += 0.2*noise.noise4d(x, y, 4*z, time * 0.2)

            dummy.scale.set(s, s, s)
            dummy.updateMatrix();

            mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);
}
