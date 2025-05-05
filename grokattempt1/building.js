function initBuilding(scene) {
    const buildingUI = document.getElementById("building");
    const buildingMenu = document.getElementById("buildingMenu");
    const buildingTypes = ["foundation", "wall", "wall_window", "wall_doorway", "door", "ceiling"];
    let selectedType = null;
    let previewMesh = null;
    let buildingMode = false;

    function updateBuildingUI() {
        buildingMenu.innerHTML = buildingTypes.map(type => `<button onclick="selectBuildingType('${type}')">${type}</button>`).join("");
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "b") {
            buildingMode = !buildingMode;
            buildingUI.style.display = buildingMode ? "block" : "none";
            if (buildingMode) {
                updateBuildingUI();
            } else if (previewMesh) {
                previewMesh.dispose();
                previewMesh = null;
            }
        }
    });

    window.selectBuildingType = function(type) {
        selectedType = type;
        if (previewMesh) previewMesh.dispose();
        previewMesh = BABYLON.MeshBuilder.CreateBox("preview", { width: 5, height: 5, depth: 5 }, scene);
        previewMesh.material = new BABYLON.StandardMaterial("previewMat", scene);
        previewMesh.material.alpha = 0.5;
    };

    // Handle building preview rendering
    scene.registerBeforeRender(() => {
        if (buildingMode && previewMesh) {
            // Updated pointer move handler for building preview
            const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, BABYLON.Matrix.Identity(), scene.activeCamera);
            const hit = scene.pickWithRay(ray);
            if (hit.pickedPoint) {
                const point = hit.pickedPoint;
                point.x = Math.round(point.x / 5) * 5;
                point.z = Math.round(point.z / 5) * 5;
                if (selectedType === "foundation" || selectedType === "ceiling") {
                    previewMesh.position = new BABYLON.Vector3(point.x, point.y, point.z);
                } else {
                    // Snap to foundation (simplified)
                    previewMesh.position = new BABYLON.Vector3(point.x, point.y + 2.5, point.z);
                }
            }
        }
    });

    // Handle building placement with pointer down
    const canvas = document.getElementById("renderCanvas");
    canvas.addEventListener("pointerdown", (evt) => {
        if (buildingMode && previewMesh && evt.button === 0) {
            const mesh = BABYLON.MeshBuilder.CreateBox(selectedType, { width: 5, height: 5, depth: 5 }, scene);
            mesh.position = previewMesh.position.clone();
            mesh.rotation = previewMesh.rotation.clone();
            mesh.checkCollisions = true;
            mesh.metadata = { type: selectedType };
            
            // Apply material based on type
            const material = new BABYLON.StandardMaterial(selectedType + "Mat", scene);
            switch(selectedType) {
                case "foundation":
                    material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Gray
                    break;
                case "wall":
                case "wall_window":
                case "wall_doorway":
                    material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8); // Light gray
                    break;
                case "door":
                    material.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.1); // Brown
                    break;
                case "ceiling":
                    material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7); // Medium gray
                    break;
                default:
                    material.diffuseColor = new BABYLON.Color3(1, 1, 1); // White
            }
            mesh.material = material;
        }
    });

    // Mouse wheel to rotate building preview
    document.addEventListener("wheel", (e) => {
        if (buildingMode && previewMesh) {
            previewMesh.rotation.y += e.deltaY * 0.01;
            e.preventDefault(); // Prevent page scrolling
        }
    });
}