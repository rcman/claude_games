// game/physics_placeholder.js
// Simple placeholder for physics engine integration

import * as THREE from '../libs/three.module.js';

// --- Mock Physics World ---
export class World {
    constructor() {
        this.gravity = new THREE.Vector3(0, -9.81, 0);
        this.bodies = [];
        console.log("Physics World Created (Placeholder)");
    }
    
    setGravity(vec) {
        this.gravity.copy(vec);
    }
    
    addBody(body) {
        this.bodies.push(body);
        return body;
    }
    
    removeBody(body) {
        const index = this.bodies.indexOf(body);
        if (index !== -1) {
            this.bodies.splice(index, 1);
        }
    }
    
    step(dt) {
        // Very simple placeholder physics step
        // In a real engine, this would update all bodies based on forces, collisions, etc.
        for (const body of this.bodies) {
            if (body.isStatic) continue;
            
            // Apply gravity
            body.velocity.y += this.gravity.y * dt;
            
            // Apply velocity
            body.position.x += body.velocity.x * dt;
            body.position.y += body.velocity.y * dt;
            body.position.z += body.velocity.z * dt;
            
            // Simple ground collision
            if (body.position.y < body.size.y/2) {
                body.position.y = body.size.y/2;
                body.velocity.y = 0;
            }
        }
    }
}

// --- Mock Physics Body ---
export class Body {
    constructor(options = {}) {
        this.isStatic = options.isStatic || false;
        this.position = options.position || new THREE.Vector3();
        this.velocity = options.velocity || new THREE.Vector3();
        this.rotation = options.rotation || new THREE.Euler();
        this.angularVelocity = options.angularVelocity || new THREE.Vector3();
        this.size = options.size || new THREE.Vector3(1, 1, 1);
        this.mass = options.mass || 1;
        this.restitution = options.restitution || 0.3; // Bounciness
        this.friction = options.friction || 0.5;
    }
    
    applyForce(force, point) {
        if (this.isStatic) return;
        
        // Apply force to velocity
        const acceleration = force.clone().divideScalar(this.mass);
        this.velocity.add(acceleration);
        
        // Implement torque later if needed
    }
    
    applyImpulse(impulse, point) {
        if (this.isStatic) return;
        
        // Apply impulse to velocity
        const deltaV = impulse.clone().divideScalar(this.mass);
        this.velocity.add(deltaV);
        
        // Implement angular impulse later if needed
    }
    
    getWorldTransform() {
        return {
            getOrigin: () => this.position,
            getRotation: () => this.rotation
        };
    }
}

// --- Helper Functions ---
export function createBoxBody(position, size, mass, isStatic = false) {
    return new Body({
        position: position.clone(),
        size: size.clone(),
        mass: mass,
        isStatic: isStatic
    });
}

export function createSphereBody(position, radius, mass, isStatic = false) {
    return new Body({
        position: position.clone(),
        size: new THREE.Vector3(radius*2, radius*2, radius*2),
        mass: mass,
        isStatic: isStatic
    });
}

export function syncMeshToBody(mesh, body) {
    mesh.position.copy(body.position);
    mesh.rotation.copy(body.rotation);
}