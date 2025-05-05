function initCrafting(scene) {
    const craftingRecipes = [
        { name: "axe", resources: { wood: 5, stone: 3 }, output: { type: "axe", count: 1 } },
        { name: "pickaxe", resources: { wood: 5, stone: 5 }, output: { type: "pickaxe", count: 1 } },
        { name: "campfire", resources: { wood: 10, stone: 5 }, output: { type: "campfire", count: 1 } },
        { name: "crafting_table", resources: { wood: 20, stone: 10 }, output: { type: "crafting_table", count: 1 } },
        { name: "forge", resources: { stone: 20, metal: 10 }, output: { type: "forge", count: 1 } },
        { name: "rope", resources: { fiber: 5 }, output: { type: "rope", count: 1 } }
    ];

    const craftingUI = document.getElementById("crafting");
    const craftingMenu = document.getElementById("craftingMenu");
    const canvas = document.getElementById("renderCanvas");

    function updateCraftingUI() {
        craftingMenu.innerHTML = craftingRecipes.map(recipe => `<button onclick="craftItem('${recipe.name}')">${recipe.name}</button>`).join("");
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "c") {
            craftingUI.style.display = craftingUI.style.display === "none" || craftingUI.style.display === "" ? "block" : "none";
            if (craftingUI.style.display === "block") {
                updateCraftingUI();
            }
        }
    });

    window.craftItem = function(name) {
        const recipe = craftingRecipes.find(r => r.name === name);
        if (!recipe) {
            console.error("Recipe not found:", name);
            return;
        }
        
        if (!scene.player) {
            console.error("Player not initialized in scene");
            return;
        }
        
        const player = scene.player;
        let canCraft = true;
        
        // Check if we have all required resources
        for (const [resource, count] of Object.entries(recipe.resources)) {
            const totalResource = player.inventory.quickBar.concat(player.inventory.slots)
                .filter(item => item.type === resource)
                .reduce((sum, item) => sum + item.count, 0);
            if (totalResource < count) {
                canCraft = false;
                console.log(`Not enough ${resource}: need ${count}, have ${totalResource}`);
            }
        }
        
        if (canCraft) {
            // Consume resources
            for (const [resource, count] of Object.entries(recipe.resources)) {
                let needed = count;
                // Check quick bar first
                for (let i = player.inventory.quickBar.length - 1; i >= 0 && needed > 0; i--) {
                    if (player.inventory.quickBar[i].type === resource) {
                        const deduct = Math.min(player.inventory.quickBar[i].count, needed);
                        player.inventory.quickBar[i].count -= deduct;
                        needed -= deduct;
                        if (player.inventory.quickBar[i].count === 0) {
                            player.inventory.quickBar.splice(i, 1);
                        }
                    }
                }
                // Then check inventory slots
                for (let i = player.inventory.slots.length - 1; i >= 0 && needed > 0; i--) {
                    if (player.inventory.slots[i].type === resource) {
                        const deduct = Math.min(player.inventory.slots[i].count, needed);
                        player.inventory.slots[i].count -= deduct;
                        needed -= deduct;
                        if (player.inventory.slots[i].count === 0) {
                            player.inventory.slots.splice(i, 1);
                        }
                    }
                }
            }
            
            // Add crafted item
            const quickBarFull = player.inventory.quickBar.length >= 4;
            if (!quickBarFull) {
                player.inventory.quickBar.push(Object.assign({}, recipe.output)); // Clone to avoid reference issues
            } else {
                player.inventory.slots.push(Object.assign({}, recipe.output)); // Clone to avoid reference issues
            }
            
            console.log(`Crafted ${recipe.name}`);
            if (typeof window.updateInventoryUI === 'function') {
                window.updateInventoryUI();
            } else {
                console.error("updateInventoryUI function not found");
            }
        } else {
            console.log("Cannot craft: missing resources");
            alert("Missing resources for crafting!");
        }
    };

    // Improved campfire interaction
    canvas.addEventListener("pointerdown", (evt) => {
        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, BABYLON.Matrix.Identity(), scene.activeCamera);
        const hit = scene.pickWithRay(ray);
        if (hit.hit && hit.pickedMesh && hit.pickedMesh.metadata?.type === "campfire") {
            console.log("Campfire interacted");
            // Simplified: Open campfire UI with 4 slots for meat/water (implement as needed)
            alert("Campfire cooking interface would open here");
        }
    });
}