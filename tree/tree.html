<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3D Apple Tree</title>
  <script async src="https://unpkg.com/es-module-shims@1.6.3/dist/es-module-shims.js"></script>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.157.0/build/three.module.js"
      }
    }
  </script>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      font-family: Arial, sans-serif;
      overflow: hidden;
    }
    .container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      align-items: center;
    }
    h1 {
      background-color: #282c34;
      color: white;
      width: 100%;
      text-align: center;
      padding: 1rem 0;
      margin: 0 0 20px 0;
    }
    .controls {
      position: absolute;
      bottom: 20px;
      background: rgba(255, 255, 255, 0.7);
      padding: 10px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>3D Apple Tree</h1>
    <div id="canvas-container"></div>
    <div class="controls">Drag to rotate | Scroll to zoom</div>
  </div>

  <script type="module">
    import * as THREE from 'three';
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Manual orbit control variables
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };
    let spherical = new THREE.Spherical(15, Math.PI / 3, 0);
    
    // Function to update camera position based on spherical coordinates
    const updateCameraPosition = () => {
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 3, 0); // Look at the center of the tree
    };
    updateCameraPosition(); // Set initial position
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x567d46,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    
    // Tree foliage (multiple parts to make it more natural)
    const foliageGeometry1 = new THREE.SphereGeometry(3, 16, 16);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const foliage1 = new THREE.Mesh(foliageGeometry1, foliageMaterial);
    foliage1.position.y = 6;
    foliage1.castShadow = true;
    scene.add(foliage1);
    
    const foliageGeometry2 = new THREE.SphereGeometry(2.5, 16, 16);
    const foliage2 = new THREE.Mesh(foliageGeometry2, foliageMaterial);
    foliage2.position.set(1.5, 5, 1.5);
    foliage2.castShadow = true;
    scene.add(foliage2);
    
    const foliageGeometry3 = new THREE.SphereGeometry(2.5, 16, 16);
    const foliage3 = new THREE.Mesh(foliageGeometry3, foliageMaterial);
    foliage3.position.set(-1.5, 5.5, -1);
    foliage3.castShadow = true;
    scene.add(foliage3);
    
    // Generate apples
    const apples = [];
    const createApple = (x, y, z) => {
      const appleGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const appleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const apple = new THREE.Mesh(appleGeometry, appleMaterial);
      apple.position.set(x, y, z);
      apple.castShadow = true;
      scene.add(apple);
      apples.push(apple);
    };
    
    // Place some apples randomly on the tree
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 1.5;
      const height = 5 + Math.random() * 2.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      createApple(x, height, z);
    }
    
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Gentle movement for the tree and apples
      apples.forEach((apple, index) => {
        apple.position.y += Math.sin(Date.now() * 0.001 + index) * 0.002;
      });
      
      renderer.render(scene, camera);
    };
    
    // Mouse event handlers for custom orbit controls
    const onMouseDown = (event) => {
      isMouseDown = true;
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };
    
    const onMouseMove = (event) => {
      if (isMouseDown) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };
        
        // Adjust theta (horizontal) and phi (vertical) angles
        spherical.theta -= deltaMove.x * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaMove.y * 0.01));
        
        updateCameraPosition();
        previousMousePosition = {
          x: event.clientX,
          y: event.clientY
        };
      }
    };
    
    const onMouseUp = () => {
      isMouseDown = false;
    };
    
    const onWheel = (event) => {
      // Zoom in/out
      spherical.radius = Math.max(5, Math.min(30, spherical.radius + event.deltaY * 0.05));
      updateCameraPosition();
      event.preventDefault();
    };
    
    // Add mouse event listeners
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    animate();
  </script>
</body>
</html>