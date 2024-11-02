import * as THREE from 'three';
import { OrbitControls, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'; 
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'; 
import GUI from 'lil-gui';

let gui = new GUI();
let settings = {
     distanceAffection : 16.0,
     avoidanceDistance: 30.0,
}

gui.add(settings, 'distanceAffection', 4.0,16.0,1.0);
gui.add(settings, 'avoidanceDistance', -30.0,30.0,1.0);

class Dot{
     constructor(radius,pivot){

          let dotMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});

          this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.1,0.1), dotMaterial);
          this.pivot = pivot;
          this.isAvoiding = false;
          this.lerpFactor = 0.0;
          this.velocityX = 0;
          this.velocityY = 0;
          this.lerpSpeed = 0.05;
          this.isAvoiding = false;
          this.radius = radius;
          this.targetPos = new THREE.Vector3(); 
     }

     avoidMouse(mousePos){
          
          let dotGlobalPos = new THREE.Vector3();
          let pivotGlobalPos = new THREE.Vector3();
          this.mesh.getWorldPosition(dotGlobalPos);
          this.pivot.getWorldPosition(pivotGlobalPos);
          pivotGlobalPos.setZ(0);
          let distance = pivotGlobalPos.distanceTo(mousePos);
          
          if(distance < settings.distanceAffection){

               let dir = new THREE.Vector3(pivotGlobalPos.x-mousePos.x, pivotGlobalPos.y-mousePos.y);
               dir.normalize();

               this.targetPos.x = dir.x * (settings.avoidanceDistance - this.radius);
               this.targetPos.y = dir.y * (settings.avoidanceDistance - this.radius);

               if(!this.isAvoiding){
                    this.lerpFactor = 0.0;
                    this.isAvoiding = true;
               }
          }
          else{
               if(this.isAvoiding){
                    this.isAvoiding = false;
                    this.lerpFactor = 0.0;
               }
               this.targetPos.copy(new THREE.Vector3());
               
          }
          
     }

     
     controlMovement(){
          this.mesh.position.lerp(this.targetPos, this.lerpFactor);

          if(this.lerpFactor < 1.0){
               this.lerpFactor += this.lerpSpeed;
          }
          
     }
     
     

}



const scene = new THREE.Scene(); 
const renderer = new THREE.WebGLRenderer(); 

var mousePos = new THREE.Vector2();




renderer.setSize( window.innerWidth, window.innerHeight ); 

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); 

const controls = new OrbitControls(camera, renderer.domElement );
controls.enableRotate = false;


document.body.appendChild( renderer.domElement );


const composer = new EffectComposer(renderer);

const renderPass = new RenderPass( scene, camera ); 
composer.addPass( renderPass ); 
const glowPass = new UnrealBloomPass();
composer.addPass( glowPass ); 


document.addEventListener("mousemove", onDocumentMouseMove, false);
function onDocumentMouseMove(event){
     
     event.preventDefault();

     mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
     mousePos.y = - (event.clientY / window.innerHeight) * 2 + 1;

     var vector = new THREE.Vector3(mousePos.x, mousePos.y, 0.5);
     vector.unproject( camera );
     var dir = vector.sub( camera.position ).normalize();
     var distance = - camera.position.z / dir.z;
     mousePos = camera.position.clone().add( dir.multiplyScalar( distance ) );
     // console.log("x" + mousePos.x);
     // console.log("y" + mousePos.y);

}

window.addEventListener("resize", onWindowResize,false);

function onWindowResize() {

     camera.aspect = window.innerWidth / window.innerHeight;
     camera.updateProjectionMatrix();


     renderer.setSize( window.innerWidth, window.innerHeight ); 
     

}


let outerSphereDots = [];
let outerSpherePivots = new THREE.Group();

var outerSphere = new THREE.Mesh(new THREE.SphereGeometry(8,64,64), new THREE.MeshBasicMaterial());
let outerPositionAttribute = outerSphere.geometry.attributes.position;

for(let i = 0; i < outerPositionAttribute.count; i++){
     const vertex = new THREE.Vector3();
     vertex.fromBufferAttribute(outerPositionAttribute, i);
     const globalPos = vertex.clone().applyMatrix4(outerSphere.matrixWorld);

     let pivot = new THREE.Group();
     pivot.position.copy(globalPos);
     let dot = new Dot(10,pivot);
     dot.mesh.material = new THREE.MeshBasicMaterial({color:0xf9a66c});
     outerSphereDots.push(dot);

     pivot.add(dot.mesh);
     dot.mesh.position.copy(new THREE.Vector3());
     outerSpherePivots.add(pivot); 
}

scene.add(outerSpherePivots);

camera.position.z = 35;

function animate() {

     for(let i = 0; i < outerSphereDots.length; i++){
          outerSphereDots[i].avoidMouse(mousePos);
          outerSphereDots[i].controlMovement();

     }


     composer.render();
     // renderer.render( scene, camera ); 

     controls.update();

} 

renderer.setAnimationLoop( animate );

