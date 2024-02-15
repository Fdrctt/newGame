/*
  To get started:
  - only the first time on the command line run:
      npm install 
  - Every time you develop / test (look at package.json to change port for static server):
      npm run dev
  - To build your static site:
      npm run build
  - To preview a static site / build, after you have run the above command:
      npm run preview
*/

//import three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';//camera controls
import Stats from 'three/examples/jsm/libs/stats.module';//frame rate and other stats

//physics library and debug helper
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'

let scene, camera, renderer, controls;//we can declare variables on one line like this
let light, dirLight;
let geometry, material, sphere, planeBody, planeMesh;
 
//physics things
let cannonDebugRenderer;
let world;
let sphereBody;//this will be the physics body

let clock;
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);


let keys = {
  left: false,
  right: false,
  up: false,
  down: false
};

// Function to handle key down events
function handleKeyDown(event) {
  const keyCode = event.keyCode;
  if (keyCode === 37) { // Left arrow key
      keys.left = true;
  } else if (keyCode === 39) { // Right arrow key
      keys.right = true;
  } else if (keyCode === 38) { // Up arrow key
      keys.up = true;
  } else if (keyCode === 40) { // Down arrow key
      keys.down = true;
  }
}

// Function to handle key up events
function handleKeyUp(event) {
  const keyCode = event.keyCode;
  if (keyCode === 37) { // Left arrow key
      keys.left = false;
  } else if (keyCode === 39) { // Right arrow key
      keys.right = false;
  } else if (keyCode === 38) { // Up arrow key
      keys.up = false;
  } else if (keyCode === 40) { // Down arrow key
      keys.down = false;
  }
}

// Update function to handle rotation based on keyboard state
function updateRotation() {
  const rotationSpeed = 0.05; // Adjust as needed
  const currentRotation = new THREE.Euler().setFromQuaternion(planeMesh.quaternion);
console.log('currentRotation: ', currentRotation.y)
    // Maximum allowed rotation angles
    const minRotationX =-1.2; // 45 degrees in radians
    const maxRotationX =-1.8;
    const minRotationY =0.3; // 45 degrees in radians
    const maxRotationY =-0.3;
   //ß const maxRotationY = Math.PI / 9; // 45 degrees in radians
    console.log('maxRotationY: ', maxRotationY)
    //console.log('maxRotationY: ', maxRotationY)

    // Rotate left
    if (keys.left && (currentRotation.y < minRotationY)) {
        planeBody.quaternion = planeBody.quaternion.mult(new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotationSpeed));
    }
    // Rotate right
    if (keys.right && (currentRotation.y > maxRotationY)) {
        planeBody.quaternion = planeBody.quaternion.mult(new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -rotationSpeed));
    }
    // Rotate up
    if (keys.up && (currentRotation.x < minRotationX)) {
        planeBody.quaternion = planeBody.quaternion.mult(new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), rotationSpeed));
    }
    // Rotate down
    if (keys.down && (currentRotation.x > maxRotationX)) {
        planeBody.quaternion = planeBody.quaternion.mult(new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -rotationSpeed));
    }
}
//helpers
let stats, gridHelper;
function logCameraPerspective() {
  console.log('Camera position:', camera.position);
  console.log('Camera rotation:', camera.rotation);
}

// Event listener for user interaction (e.g., mouse move)
window.addEventListener('mousemove', function(event) {
  // Call the logCameraPerspective function whenever the user interacts with the scene
  //logCameraPerspective();
});

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  //camera.position.set( 0, 20, 0 );
  //camera.rotation.set(0,0,0)
  camera.position.set(-7.061412524130943e-9, 19.999999999989964, 0.000020000887739530166);
  camera.rotation.set(-1.57079532675051, -3.5307062617529264e-10, -0.0003530549404951961);
  
  //Cannon physics set up
  world = new CANNON.World();//create world
  world.gravity.set(0, -9.82, 0);//set gravity

  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  // camera user interaction controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  //set up our scene
  // ambient light (from all around)
  light = new THREE.AmbientLight( 0xfffafe ); // soft white light
  scene.add( light );

  //directional light
  dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  dirLight.position.set( - 1, 1.75, 1 );//angle the light
  dirLight.position.multiplyScalar( 20 );// move it back... or do it in one line
  //Cast shadows
  //https://threejs.org/docs/#api/en/lights/shadows/DirectionalLightShadow
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024; // default
  dirLight.shadow.mapSize.height = 1024; // default
  dirLight.shadow.camera.left = 10; // default
  dirLight.shadow.camera.right = -10; // default
  dirLight.shadow.camera.top = 10; // default
  dirLight.shadow.camera.bottom = -10; // default
  dirLight.shadow.camera.near = 0.5; // default
  dirLight.shadow.camera.far = 100; // default
  //add to scene
  scene.add( dirLight );
  //see where your directional light is
  // const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
  // scene.add( dirLightHelper );

  //Create a helper for the shadow camera (optional)
  // const helper = new THREE.CameraHelper( dirLight.shadow.camera );
  // scene.add( helper );

  geometry = new THREE.SphereGeometry( 0.5, 32, 16 );
  material = new THREE.MeshPhysicalMaterial( {
      color: new THREE.Color("rgb(255, 0, 255)"),
      metalness: 0.8,
      roughness: 0.5,
      reflectivity: 0.5
  } );
  
  sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(0,0.6,0);
  sphere.castShadow = true;
  scene.add( sphere );

  const radius = 0.5

  const sphereShape = new CANNON.Sphere(radius);
  sphereBody = new CANNON.Body({ mass: 1, shape: sphereShape })
  sphereBody.position.x = sphere.position.x;//we copy over the three.js mesh position to the collider / physics body 
  sphereBody.position.y = sphere.position.y;
  sphereBody.position.z = sphere.position.z;

  //Add the ground
  const phongMaterial = new THREE.MeshPhongMaterial();
  const planeGeometry = new THREE.PlaneGeometry(32, 18);
   planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
  planeMesh.rotateX(-Math.PI / 2);
  planeMesh.receiveShadow = true;
  scene.add(planeMesh);//add to three.js scene
  //ground physics body
  const planeShape = new CANNON.Plane();
  planeBody = new CANNON.Body({ mass: 0 });
  planeBody.addShape(planeShape,planeMesh.position);
   planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  // planeBody.position.copy(planeMesh.position);
 // world.addBody(planeBody);

 
    
  clock = new THREE.Clock();

  //Debug Helpers
  // gridHelper = new THREE.GridHelper( 40, 40 );
  // scene.add( gridHelper );

   cannonDebugRenderer = new CannonDebugger(scene, world, {
  //   // options...
   });
   
   createBorder(planeMesh);

  world.addBody(planeBody);
  world.addBody(sphereBody);
  createLid(planeMesh)
  //For frame rate etc
  stats = Stats();
  stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom)

  //add event listener, when window is resized call onWindowResize callback
  window.addEventListener('resize', onWindowResize );

  const loader = new THREE.TextureLoader();
loader.load(
    '/textures/mytex/TexW2.jpg', // Make sure this path is correct
    function(texture) {
        // Update the existing plane material with the loaded texture
        planeMesh.material.map = texture;
        planeMesh.material.needsUpdate = true; // Important to update the material
    },
    undefined, // onProgress callback not supported by all browsers
    function(error) {
        console.error('An error occurred loading the texture:', error);
    }
  );

  addWallRelativeToPlane(planeMesh, 9.7, -6.8, 'hor');
  addWallRelativeToPlane(planeMesh, 4.7, -6.8, 'hor');
  addWallRelativeToPlane(planeMesh, -4.4, -6.8, 'hor');
  addWallRelativeToPlane(planeMesh, 7, -3.4, 'ver');
  addWallRelativeToPlane(planeMesh, 7, 0.7, 'ver');
  addWallRelativeToPlane(planeMesh, 5, 1.8, 'ver');
  addWallRelativeToPlane(planeMesh, -4.4, -6.8, 'hor');
  addWallRelativeToPlane(planeMesh, 5, 1.8, 'ver');
  addWallRelativeToPlane(planeMesh, -2.5, -1.7, 'hor');
  addWallRelativeToPlane(planeMesh, 2.5, -1.7, 'hor');
  addWallRelativeToPlane(planeMesh, 2.5, -1.7, 'hor');
  addWallRelativeToPlane(planeMesh, 10.7, -2.5, 'hor');
  addWallRelativeToPlane(planeMesh, 12.55, -1, 'hor');
  addWallRelativeToPlane(planeMesh, 14, 0.8, 'ver');
  addWallRelativeToPlane(planeMesh, -0.9, -3.3, 'hor');
  addWallRelativeToPlane(planeMesh, 0.9, -4.75, 'ver');
  addWallRelativeToPlane(planeMesh, 0.9, -4.75, 'ver');
  addWallRelativeToPlane(planeMesh, -9.5, -6.8, 'hor');
  addWallRelativeToPlane(planeMesh, 0.9, -4.75, 'ver');
  addWallRelativeToPlane(planeMesh, 4, -3.2, 'ver');
  addWallRelativeToPlane(planeMesh, 1, 3, 'ver');
  addWallRelativeToPlane(planeMesh, 12.1, 2.4, 'ver');
  addWallRelativeToPlane(planeMesh, 9, -1.05, 'ver');
  addWallRelativeToPlane(planeMesh, -9.5, -2.6, 'hor');
  addWallRelativeToPlane(planeMesh, -11, -1, 'hor');
  addWallRelativeToPlane(planeMesh, -7.5, -5, 'hor');
  addWallRelativeToPlane(planeMesh, -11.5, 0.8, 'hor');
  addWallRelativeToPlane(planeMesh, -11.5, 2.5, 'hor');
  addWallRelativeToPlane(planeMesh, -9.5, 4.3, 'hor');
  addWallRelativeToPlane(planeMesh, -9.5, 6, 'hor');
  addWallRelativeToPlane(planeMesh, -4.3, 0, 'hor');
  addWallRelativeToPlane(planeMesh, -2.9, 3.5, 'hor');
  addWallRelativeToPlane(planeMesh, -2.5, 1.6, 'hor');
  addWallRelativeToPlane(planeMesh, -2.5, -5, 'hor');
  addWallRelativeToPlane(planeMesh, 2.5, 6, 'hor');
  addWallRelativeToPlane(planeMesh, 7.5, 6.8, 'hor');
  addWallRelativeToPlane(planeMesh, 12.5, 6.8, 'hor');
  addWallRelativeToPlane(planeMesh, 8.5, 5, 'hor');
  addWallRelativeToPlane(planeMesh, 11.5, -4, 'hor');
  addWallRelativeToPlane(planeMesh, 12.95, -5.6, 'ver');
  addWallRelativeToPlane(planeMesh, 6.8, 3.25, 'hor');
  addWallRelativeToPlane(planeMesh, 6.8, 3.25, 'hor');
  addWallRelativeToPlane(planeMesh, 3, 1.5, 'ver');
  addWallRelativeToPlane(planeMesh, 10, 3.5, 'ver');
  addWallRelativeToPlane(planeMesh, -6, 5, 'ver');
  addWallRelativeToPlane(planeMesh, -4, 6, 'ver');
  addWallRelativeToPlane(planeMesh, -1, 4.95, 'ver');
  addWallRelativeToPlane(planeMesh, -13, 3.95, 'ver');
  addWallRelativeToPlane(planeMesh, -13, 3.95, 'ver');
  addWallRelativeToPlane(planeMesh, -12.9, -2.45, 'ver');
  addWallRelativeToPlane(planeMesh, -8, -1.15, 'ver');
  addWallRelativeToPlane(planeMesh, -8, -1.15, 'ver');
  addWallRelativeToPlane(planeMesh, -6, -3.5, 'ver');




}
function addWallRelativeToPlane(parent, x, y, dir) {
  let geometry
if(dir == 'hor'){
   geometry = new THREE.BoxGeometry(3.4, 1, 0.5);
}
else{
   geometry = new THREE.BoxGeometry(0.5,1, 3.4);

}
  const material = new THREE.MeshPhysicalMaterial({ color: 0xffffff });

  // Create mesh using geometry and material
  const wallMesh = new THREE.Mesh(geometry, material);

  // Set position of the wall relative to the parent
  wallMesh.position.set(x,y, 0.5);
  wallMesh.rotateX(-Math.PI / 2);
  // Add the wall mesh to the parent
  parent.add(wallMesh);

  // Create Cannon.js box shape for the wall
  let wallShape;
  if(dir == 'hor'){
   // geometry = new THREE.BoxGeometry(3.4, 1, 0.5);
     wallShape = new CANNON.Box(new CANNON.Vec3(1.7,0.5,0.25));

 }
 else{
  //  geometry = new THREE.BoxGeometry(0.5,1, 3.4);
     wallShape = new CANNON.Box(new CANNON.Vec3(0.25,0.5, 1.7));

 }
  const wallBody = new CANNON.Body({ mass: 1 }); // Assuming the wall is static

 // wallBody.position.copy(wallMesh.position);
  wallBody.addShape(wallShape);
  wallBody.quaternion.set(
    wallMesh.quaternion.x,
    wallMesh.quaternion.y,
    wallMesh.quaternion.z,
    wallMesh.quaternion.w
  );
 // wallBody.position.copy(wallMesh.position);
 //wallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  planeBody.addShape(wallShape, new CANNON.Vec3(x,y,0.5), wallBody.quaternion);
}

function createLid(parent){
  const boxMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000, // Color of the surface
    transparent: true, // Make the material transparent
    opacity: 0, // Set the opacity level (adjust as needed)
   side: THREE.DoubleSide // Ensure the material is visible from both sides
});

const boxGeometry = new THREE.BoxGeometry(32, 0.1, 18); // Adjust size as needed
const seeThroughBox = new THREE.Mesh(boxGeometry, boxMaterial);

  // Adjusting the position based on plane dimensions
  seeThroughBox.position.set(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z + 1.2);
  seeThroughBox.rotateX(-Math.PI / 2);

  //seeThroughPlane.rotateX(-Math.PI / 2);
  parent.add(seeThroughBox);

  const boxShape = new CANNON.Box(new CANNON.Vec3(16, 0.05, 9)); // Adjust halfExtents to match box size
  const boxBody = new CANNON.Body({ mass: 1 }); // Assuming the box is static
  boxBody.addShape(boxShape);
  boxBody.position.copy(seeThroughBox.position);
  //seeThroughPlaneBody.position.set(seeThroughPlane.position.x, seeThroughPlane.position.y, seeThroughPlane.position.z);
  boxBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  planeBody.addShape(boxShape, new CANNON.Vec3(0, 0, 1.2), boxBody.quaternion);

}
function createBorder(parent) {
  const borderGeometry1 = new THREE.BoxGeometry(1, 1, 32);
  const borderGeometry2 = new THREE.BoxGeometry(1, 17, 1);
  const borderMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("rgb(255, 0, 255)"),
    metalness: 0.8,
    roughness: 0.5,
    reflectivity: 0.5
  });

  const border1 = new THREE.Mesh(borderGeometry1, borderMaterial);
  border1.rotateY(-Math.PI / 2);
  border1.position.set(0, 0, 0);
  border1.castShadow = true;
  border1.position.y = -9;
  border1.position.z = 0.5;

  const border2 = new THREE.Mesh(borderGeometry1, borderMaterial);
  border2.rotateY(-Math.PI / 2);
  border2.position.set(0, 0, 0);
  border2.castShadow = true;
  border2.position.y = 9;
  border2.position.z = 0.5;

  const border3 = new THREE.Mesh(borderGeometry2, borderMaterial);
  border3.rotateY(-Math.PI / 2);
  border3.position.set(0, 0, 0);
  border3.castShadow = true;
  border3.position.x = -15.5;
  border3.position.z = 0.5;
  
  const border4 = new THREE.Mesh(borderGeometry2, borderMaterial);
  border4.rotateY(-Math.PI / 2);
  border4.position.set(0, 0, 0);
  border4.castShadow = true;
  border4.position.x = 15.5;
  border4.position.z = 0.5;

  parent.add(border1);
  parent.add(border2);
  parent.add(border3);
  parent.add(border4);

  const borderShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 16));
  const borderShape2 = new CANNON.Box(new CANNON.Vec3(0.5, 8.5, 0.5));
  const borderBody1 = new CANNON.Body({ mass: 1 });
  const borderBody2 = new CANNON.Body({ mass: 1 });
  const borderBody3 = new CANNON.Body({ mass: 1 });
  const borderBody4 = new CANNON.Body({ mass: 1 });

  borderBody1.addShape(borderShape);
  borderBody1.quaternion.set(
    border1.quaternion.x,
    border1.quaternion.y,
    border1.quaternion.z,
    border1.quaternion.w
  );

  borderBody2.addShape(borderShape);
  borderBody2.quaternion.set(
    border2.quaternion.x,
    border2.quaternion.y,
    border2.quaternion.z,
    border2.quaternion.w
  );

  borderBody3.addShape(borderShape2);
  borderBody3.quaternion.set(
    border3.quaternion.x,
    border3.quaternion.y,
    border3.quaternion.z,
    border3.quaternion.w
  );

  borderBody4.addShape(borderShape2);
  borderBody4.quaternion.set(
    border4.quaternion.x,
    border4.quaternion.y,
    border4.quaternion.z,
    border4.quaternion.w
  );

  planeBody.addShape(borderShape, new CANNON.Vec3(0.0, -9, 0.5), borderBody1.quaternion);
  planeBody.addShape(borderShape, new CANNON.Vec3(0.0, 9, 0.5), borderBody2.quaternion);
  planeBody.addShape(borderShape2, new CANNON.Vec3(-15.5, 0, 0.5), borderBody3.quaternion);
  planeBody.addShape(borderShape2, new CANNON.Vec3(15.5, 0, 0.5), borderBody4.quaternion);
}
function animate() {
	requestAnimationFrame( animate );//manually call request next animation frame

  // Copy coordinates from Cannon-es to Three.js
   sphere.position.set(sphereBody.position.x, sphereBody.position.y, sphereBody.position.z);
  // sphere.quaternion.set(
  //     sphereBody.quaternion.x,
  //     sphereBody.quaternion.y,
  //     sphereBody.quaternion.z,
  //     sphereBody.quaternion.w
  // );
  if (sphere.position.y <= 0.5 ) {
    //createLid(); // Call the function to create the lid
}
  planeMesh.position.copy(planeBody.position);
  planeMesh.quaternion.copy(planeBody.quaternion);

  //planeBody.position.x +=0.01;

  
//   const deltaQuaternion = new CANNON.Quaternion();
// deltaQuaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), 0.01); // Assuming rotation around the x-axis

// // Apply the rotation increment to the body's quaternion
// planeBody.quaternion = planeBody.quaternion.mult(deltaQuaternion);
  

updateRotation();


  //physics step
  let delta = Math.min(clock.getDelta(), 0.1);
  world.step(delta);

  //render the scene
	renderer.render( scene, camera );

  //update stats
  stats.update();
 cannonDebugRenderer.update();//comment this out normally
}

//initialize then call animation loop
init();
animate();

function onWindowResize() {
  //resize everything on Window Resize
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

}

