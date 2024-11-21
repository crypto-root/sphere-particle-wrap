import * as THREE from 'three';
import { OrbitControls, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'; 
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'; 
import GUI from 'lil-gui';

let outerSphereDots = [];
let outerSpherePivots = new THREE.Group();

let gui = new GUI();
let settings = {
     distanceAffection : 16.0,
     avoidanceFactor: 30.0,
     avoidRelativeToPivot: true,
     countZAxisDirection: true,
     toggleRotation: true,
}

gui.add(settings, 'distanceAffection', 4.0,16.0,1.0);
gui.add(settings, 'avoidanceFactor', -30.0,30.0,1.0);
gui.add(settings, 'avoidRelativeToPivot');
gui.add(settings, 'countZAxisDirection');
gui.add(settings, 'toggleRotation').onChange((val) => {
     if(val == false){
          outerSpherePivots.rotation.set(0,0,0);
     }
});

class Dot{
     constructor(radius,pivot){

          let dotMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});

          this.mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.1,1.0), dotMaterial);
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

          if(!settings.countZAxisDirection){
               pivotGlobalPos.setZ(0);
          }

          let distance;
          if(settings.avoidRelativeToPivot){
               distance = pivotGlobalPos.distanceTo(mousePos);
          }
          else{
               distance = dotGlobalPos.distanceTo(mousePos);
          }
          
          if(distance < settings.distanceAffection){

               let dir = new THREE.Vector3();
               
               if(settings.avoidRelativeToPivot){
                    dir = new THREE.Vector3(pivotGlobalPos.x-mousePos.x, pivotGlobalPos.y-mousePos.y, pivotGlobalPos.z);
               }
               else{
                    dir = new THREE.Vector3(dotGlobalPos.x-mousePos.x, dotGlobalPos.y-mousePos.y, dotGlobalPos.z);
               }

               dir.normalize();

               this.targetPos.x = dir.x * (settings.avoidanceFactor - this.radius);
               this.targetPos.y = dir.y * (settings.avoidanceFactor - this.radius);

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

var cursorPos = new THREE.Vector2();




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

     cursorPos.x = (event.clientX / window.innerWidth) * 2 - 1;
     cursorPos.y = - (event.clientY / window.innerHeight) * 2 + 1;

     var vector = new THREE.Vector3(cursorPos.x, cursorPos.y, 0.5);
     vector.unproject( camera );
     var dir = vector.sub( camera.position ).normalize();
     var distance = - camera.position.z / dir.z;
     cursorPos = camera.position.clone().add( dir.multiplyScalar( distance ) );

}

document.addEventListener("touchmove", onDocumentTouchMove, false);
function onDocumentTouchMove(event){
     
     event.preventDefault();

     cursorPos.x = (event.touches[0].clientX    / window.innerWidth) * 2 - 1;
     cursorPos.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;

     var vector = new THREE.Vector3(cursorPos.x, cursorPos.y, 0.5);
     vector.unproject( camera );
     var dir = vector.sub( camera.position ).normalize();
     var distance = - camera.position.z / dir.z;
     cursorPos = camera.position.clone().add( dir.multiplyScalar( distance ) );

}

window.addEventListener("resize", onWindowResize,false);

function onWindowResize() {

     camera.aspect = window.innerWidth / window.innerHeight;
     camera.updateProjectionMatrix();


     renderer.setSize( window.innerWidth, window.innerHeight ); 
     

}


var outerSphere = new THREE.Mesh(new THREE.SphereGeometry(8,32,32), new THREE.MeshBasicMaterial());
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

     if(settings.toggleRotation){
          outerSpherePivots.rotation.x += 0.01;
          outerSpherePivots.rotation.y += 0.01;
          outerSpherePivots.rotation.z += 0.01;
     }
     for(let i = 0; i < outerSphereDots.length; i++){
          outerSphereDots[i].avoidMouse(cursorPos);
          outerSphereDots[i].controlMovement();

     }


     composer.render();
     // renderer.render( scene, camera ); 

     controls.update();

} 

renderer.setAnimationLoop( animate );

