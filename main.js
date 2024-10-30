import * as THREE from 'three';
import { FBXLoader, GLTFLoader, OrbitControls, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { clamp, normalize, randFloat, randInt } from 'three/src/math/MathUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'; 
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'; 


// function randomInt(min, max){
//      return Math.floor(Math.random() * (max-min+1)+min);
// }


const scene = new THREE.Scene(); 
const renderer = new THREE.WebGLRenderer(); 

// renderer.setClearColor(0x010328);


// scene.add(new THREE.AmbientLight(0xffffff));
scene.add(new THREE.DirectionalLight(0xffffff));

// renderer.setClearColor(0xffffff);
renderer.setSize( window.innerWidth, window.innerHeight ); 

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); 

const controls = new OrbitControls(camera, renderer.domElement );


// by default no ascii effect
document.body.appendChild( renderer.domElement );

// let directionalLight = new THREE.DirectionalLight(0xffffff, 100);
// scene.add(directionalLight);




const composer = new EffectComposer(renderer);

const renderPass = new RenderPass( scene, camera ); 
composer.addPass( renderPass ); 
const glowPass = new UnrealBloomPass();
composer.addPass( glowPass ); 




window.addEventListener("resize", onWindowResize,false);

function onWindowResize() {

     camera.aspect = window.innerWidth / window.innerHeight;
     camera.updateProjectionMatrix();


     renderer.setSize( window.innerWidth, window.innerHeight ); 
     

}



const gltfLoader = new GLTFLoader();
const url = 'assets/blue-whale/scene.gltf';
let mixer;
var root;
gltfLoader.load(url, (gltf) => {
     root = gltf.scene;
     // mixer = new THREE.AnimationMixer(gltf.scene);
     // const clips = gltf.animations;
     // mixer.clipAction(clips[0]).play();
     recursive(gltf.scene.children);
     // scene.add(root);
});

let pivots = new THREE.Group();
function recursive(children){
     for(let i = 0; i < children.length; i++){
          let child = children[i];
          if(child.children.length > 0){
               recursive(child.children);
          }
          if(child.geometry && child.geometry.attributes.position){
               const positionAttribute = child.geometry.attributes.position;
               root.scale.set(0.0001,0.0001,0.0001);
               root.updateMatrixWorld(true);
               for(let i = 0; i < positionAttribute.count; i++){
                    const vertex = new THREE.Vector3();
                    vertex.fromBufferAttribute(positionAttribute, i);
                    const globalPos = vertex.clone().applyMatrix4(root.matrixWorld);
                    console.log(globalPos);
                    let sphere = new THREE.Mesh(new THREE.SphereGeometry(0.05), new THREE.MeshBasicMaterial({color: 0xffffff}));
                    sphere.position.copy(globalPos);
                    
                    let pivot = new THREE.Group();
                    pivot.add(sphere);
                    pivots.add(pivot); 
               }
          }
     }
}

scene.add(pivots);

// let cube = new THREE.Mesh(new THREE.BoxGeometry(1,1,1,20,20, 20), new THREE.MeshBasicMaterial({wireframe: true}));
// scene.add(cube);


camera.position.z = 1;

// let pivots = new THREE.Group();

// const positionAttribute = cube.geometry.attributes.position;
// for(let i = 0; i < positionAttribute.count; i++){
//      const vertex = new THREE.Vector3();
//      vertex.fromBufferAttribute(positionAttribute, i);
//      cube.localToWorld(vertex);
//      let sphere = new THREE.Mesh(new THREE.SphereGeometry(0.004), new THREE.MeshBasicMaterial({color: 0xffffff}));
//      sphere.position.copy(vertex);
//      let pivot = new THREE.Group();
//      pivot.add(sphere);
//      let randVal = randFloat(0.2, 1.0);
//      pivot.scale.set(randVal,randVal, randVal);
//      pivots.add(pivot);
// }

// scene.add(pivots);





function animate() {
     // pivots.rotation.x += 0.007;
     // pivots.rotation.z -= 0.007;
     // pivots.rotation.y -= 0.007;

     // for(let i = 0; i < pivots.children.length; i++){
     //      if(i % 2 == 0){
     //                pivots.children[i].rotation.x += 0.007;
     //                pivots.children[i].rotation.y += 0.007;
     //           }
     //      else{
     //                pivots.children[i].rotation.x -= 0.007;
     //                pivots.children[i].rotation.y -= 0.007;
     //                pivots.children[i].rotation.z -= 0.007;
               
     //      }
     // } 

     // if (mixer) mixer.update(0.2);

     composer.render();
     // renderer.render( scene, camera ); 

     controls.update();

} 

renderer.setAnimationLoop( animate );

class Dot{
    
     constructor(geometry, initPos){
          // let dotMaterial =  new THREE.MeshPhongMaterial();
          // dotMaterial.color = new THREE.Color(dotColors[randInt(0,1)]);
          // dotMaterial.emissive = dotMaterial.color;
          // dotMaterial.emissiveIntensity = 5;

          let dotMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});

          this.mesh = new THREE.Mesh(geometry, dotMaterial);
          this.initPos = initPos;
          
          this.velocityX = 0.0;
          this.velocityY = 0.0;
     }
     setVelocity(){
          let dir = new THREE.Vector2(mousePos.x-this.mesh.position.x, mousePos.y-this.mesh.position.y);
          dir.normalize();
          // console.log("dir x:" + dir.x);
          // console.log("dir y:" + dir.y);
          this.velocityX = dir.x;
          this.velocityY = dir.y;
     }

     move(){
          this.mesh.position.x += this.velocityX;
          this.mesh.position.y += this.velocityY; 
     }
     friction(){
          if(this.velocityX > 0.0){
               if(this.velocityX - settings.frictionRate < 0.0){
                    this.velocityX = 0.0;
               }
               else {
                    this.velocityX -= settings.frictionRate;
               }
          }
          if(this.velocityX < 0.0){
               if(this.velocityX + settings.frictionRate > 0.0){
                    this.velocityX = 0.0;
               }
               else{
                    this.velocityX += settings.frictionRate;
               }
          }

          
          if(this.velocityY > 0.0){
               if(this.velocityY - 0.1 < 0.0){
                    this.velocityY = 0.0;
               }
               else {
                    this.velocityY -= 0.1;
               }
               
          }
          if(this.velocityY < 0.0){
               if(this.velocityY + 0.1 > 0.0){
                    this.velocityY = 0.0;
               }
               else {
                    this.velocityY += 0.1;
               }
          }

          
     }
     

}