/**
 * Minified by jsDelivr using Terser v5.19.2.
 * Original file: /npm/three-pointer-lock-controls@1.0.0/PointerLockControls.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
module.exports=function(t){return function(e){var n=this;e.rotation.set(0,0,0);var o=new t.Object3D;o.add(e);var i=new t.Object3D;i.position.y=10,i.add(o);var r,a,m=Math.PI/2,u=function(t){if(!1!==n.enabled){var e=t.movementX||t.mozMovementX||t.webkitMovementX||0,r=t.movementY||t.mozMovementY||t.webkitMovementY||0;i.rotation.y-=.002*e,o.rotation.x-=.002*r,o.rotation.x=Math.max(-m,Math.min(m,o.rotation.x))}};this.dispose=function(){document.removeEventListener("mousemove",u,!1)},document.addEventListener("mousemove",u,!1),this.enabled=!1,this.getObject=function(){return i},this.getDirection=(r=new t.Vector3(0,0,-1),a=new t.Euler(0,0,0,"YXZ"),function(t){return a.set(o.rotation.x,i.rotation.y,0),t.copy(r).applyEuler(a),t})}};
//# sourceMappingURL=/sm/9c199a6f99a59496014182a5ae8f5ea2dbdbb0f9314ca388e374fb27a0e5898e.map