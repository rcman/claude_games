function initPlayer(scene, camera) {
    const player = {
        inventory: {
            quickBar: [{ type: "axe", count: 1 }, { type: "pickaxe", count: 1 }, { type: "knife", count: 1 }, { type: "canteen", count: 1 }],
            slots: []
        },
        position: camera.position
    };

    const inventoryUI = document.getElementById("inventory");
    const quickBarUI = document.getElementById("quickBar");
    const inventorySlotsUI = document.getElementById("inventorySlots");

    // Make updateInventoryUI globally accessible
    window.updateInventoryUI = function() {
        quickBarUI.innerHTML = player.inventory.quickBar.map((item, i) => `<div>${item.type} (${item.count})</div>`).join("");
        inventorySlotsUI.innerHTML = player.inventory.slots.map((item, i) => `<div>${item.type} (${item.count})</div>`).join("");
    };

    document.addEventListener("keydown", (e) => {
        if (e.key === "i") {
            inventoryUI.style.display = inventoryUI.style.display === "none" ? "block" : "none";
            window.updateInventoryUI();
        }
        if (e.key === "e") {
            const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, BABYLON.Matrix.Identity(), camera);
            const hit = scene.pickWithRay(ray);
            if (hit.pickedMesh && hit.pickedMesh.metadata) {
                const { type, wood, stone, fiber, metal, loot } = hit.pickedMesh.metadata;
                if (type === "tree" && player.inventory.quickBar.some(item => item.type === "axe")) {
                    player.inventory.slots.push({ type: "wood", count: wood });
                    hit.pickedMesh.dispose();
                } else if (type === "rock" && player.inventory.quickBar.some(item => item.type === "pickaxe")) {
                    player.inventory.slots.push({ type: "stone", count: stone });
                    hit.pickedMesh.dispose();
                } else if (type === "grass") {
                    player.inventory.slots.push({ type: "fiber", count: fiber });
                    hit.pickedMesh.dispose();
                } else if (type === "scrap") {
                    player.inventory.slots.push({ type: "metal", count: metal });
                    hit.pickedMesh.dispose();
                } else if (type === "barrel" || type === "crate") {
                    player.inventory.slots.push({ type: loot[Math.floor(Math.random() * loot.length)], count: 1 });
                    hit.pickedMesh.dispose();
                } else if (type === "animal" && player.inventory.quickBar.some(item => item.type === "knife")) {
                    player.inventory.slots.push({ type: "meat", count: hit.pickedMesh.metadata.meat });
                    player.inventory.slots.push({ type: "leather", count: hit.pickedMesh.metadata.leather });
                    player.inventory.slots.push({ type: "fat", count: hit.pickedMesh.metadata.fat });
                    hit.pickedMesh.dispose();
                }
                window.updateInventoryUI();
            }
        }
    });

    inventoryUI.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        // Simplified: Move items between quickBar and slots (implement as needed)
    });
    
    // Expose player object to scene for access by other modules
    scene.player = player;
}