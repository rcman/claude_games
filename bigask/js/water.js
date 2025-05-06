// Water.js - Handles water rendering in the game
class Water {
    constructor(scene, worldSize, waterLevel) {
        this.scene = scene;
        this.worldSize = worldSize;
        this.waterLevel = waterLevel;
        this.waterMesh = null;
        this.clock = new THREE.Clock();
        this.init();
    }

    init() {
        // Create water geometry
        const waterGeometry = new THREE.PlaneGeometry(this.worldSize, this.worldSize, 32, 32);
        
        // Create water material with custom shader
        const waterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterColor: { value: new THREE.Color(0x0077be) },
                waterDepth: { value: 10.0 },
                foamColor: { value: new THREE.Color(0xffffff) },
                sunDirection: { value: new THREE.Vector3(0.5, 0.5, 0.5).normalize() },
                sunColor: { value: new THREE.Color(0xffffff) },
                fogColor: { value: new THREE.Color(0xaaaaaa) },
                fogDensity: { value: 0.003 },
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vUv = uv;
                    
                    // Create wave effect
                    float wave1 = sin((position.x + time * 0.5) * 0.05) * 0.5;
                    float wave2 = sin((position.z + time * 0.3) * 0.07) * 0.5;
                    
                    vec3 pos = position;
                    pos.y += wave1 + wave2;
                    
                    vPosition = pos;
                    
                    // Calculate normal based on wave gradient
                    vec3 tangent = normalize(vec3(1.0, cos((position.x + time * 0.5) * 0.05) * 0.05, 0.0));
                    vec3 bitangent = normalize(vec3(0.0, cos((position.z + time * 0.3) * 0.07) * 0.07, 1.0));
                    vNormal = normalize(cross(tangent, bitangent));
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 waterColor;
                uniform float waterDepth;
                uniform vec3 foamColor;
                uniform vec3 sunDirection;
                uniform vec3 sunColor;
                uniform vec3 fogColor;
                uniform float fogDensity;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    // Base water color
                    vec3 color = waterColor;
                    
                    // Add foam at edges
                    float edge = pow(1.0 - abs(dot(vNormal, vec3(0.0, 1.0, 0.0))), 4.0);
                    color = mix(color, foamColor, edge * 0.3);
                    
                    // Add sun reflection
                    float sunReflection = pow(max(0.0, dot(reflect(-sunDirection, vNormal), vec3(0.0, 0.0, 1.0))), 100.0);
                    color += sunColor * sunReflection * 0.5;
                    
                    // Add depth-based color
                    float depth = 1.0 - exp(-vPosition.y / waterDepth);
                    color = mix(waterColor * 0.5, color, depth);
                    
                    // Add fog
                    float fogFactor = 1.0 - exp(-fogDensity * vPosition.y * vPosition.y);
                    color = mix(color, fogColor, fogFactor * 0.3);
                    
                    gl_FragColor = vec4(color, 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
        });
        
        // Create water mesh
        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.y = this.waterLevel;
        this.waterMesh.receiveShadow = true;
        
        // Add water to scene
        this.scene.add(this.waterMesh);
        
        // Mark as water for collision detection
        this.waterMesh.isWater = true;
    }
    
    update() {
        if (this.waterMesh) {
            this.waterMesh.material.uniforms.time.value = this.clock.getElapsedTime();
        }
    }
    
    isPointInWater(point) {
        return point.y <= this.waterLevel;
    }
}

// Create a simpler version of water for lower-end devices
class SimpleWater {
    constructor(scene, worldSize, waterLevel) {
        this.scene = scene;
        this.worldSize = worldSize;
        this.waterLevel = waterLevel;
        this.waterMesh = null;
        this.init();
    }
    
    init() {
        // Create water geometry
        const waterGeometry = new THREE.PlaneGeometry(this.worldSize, this.worldSize);
        
        // Create water material
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x0077be,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.6,
        });
        
        // Create water mesh
        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.y = this.waterLevel;
        this.waterMesh.receiveShadow = true;
        
        // Add water to scene
        this.scene.add(this.waterMesh);
        
        // Mark as water for collision detection
        this.waterMesh.isWater = true;
    }
    
    update() {
        // No animation in simple water
    }
    
    isPointInWater(point) {
        return point.y <= this.waterLevel;
    }
}