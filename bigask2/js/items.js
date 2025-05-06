// js/items.js

const ItemData = {
    // Resources
    'wood': { name: 'Wood', icon: 'assets/items/wood.png', stack: 50, type: 'resource' },
    'stone': { name: 'Stone', icon: 'assets/items/stone.png', stack: 50, type: 'resource' },
    'stick': { name: 'Stick', icon: 'assets/items/stick.png', stack: 50, type: 'resource' }, // Often a byproduct or specific harvest
    'fiber': { name: 'Fiber', icon: 'assets/items/fiber.png', stack: 50, type: 'resource' },
    'iron_ore': { name: 'Iron Ore', icon: 'assets/items/iron_ore.png', stack: 50, type: 'resource' },
    'flint': { name: 'Flint', icon: 'assets/items/flint.png', stack: 50, type: 'resource' },
    'leather': { name: 'Leather', icon: 'assets/items/leather.png', stack: 20, type: 'material' },
    'wolf_pelt': { name: 'Wolf Pelt', icon: 'assets/items/wolf_pelt.png', stack: 10, type: 'material' },
    'wolf_fang': { name: 'Wolf Fang', icon: 'assets/items/wolf_fang.png', stack: 10, type: 'material' },
    'rabbit_fur': { name: 'Rabbit Fur', icon: 'assets/items/rabbit_fur.png', stack: 20, type: 'material' },
    'bear_pelt': { name: 'Bear Pelt', icon: 'assets/items/bear_pelt.png', stack: 5, type: 'material' },
    'bear_claw': { name: 'Bear Claw', icon: 'assets/items/bear_claw.png', stack: 10, type: 'material' },
    'feather': { name: 'Feather', icon: 'assets/items/feather.png', stack: 50, type: 'material' },
    'iron_ingot': { name: 'Iron Ingot', icon: 'assets/items/iron_ingot.png', stack: 30, type: 'material' },
    'rope': { name: 'Rope', icon: 'assets/items/rope.png', stack: 20, type: 'material' },
    'herbs': { name: 'Herbs', icon: 'assets/items/herbs.png', stack: 20, type: 'material' }, // For tea

    // Food
    'apple': { name: 'Apple', icon: 'assets/items/apple.png', stack: 10, type: 'food', hungerValue: 10, thirstValue: 2 },
    'berries': { name: 'Berries', icon: 'assets/items/berries.png', stack: 20, type: 'food', hungerValue: 5, thirstValue: 1 },
    'raw_meat': { name: 'Raw Meat', icon: 'assets/items/raw_meat.png', stack: 10, type: 'food', hungerValue: 5, healthValue: -5 }, // Eating raw meat is bad
    'raw_fish': { name: 'Raw Fish', icon: 'assets/items/raw_fish.png', stack: 10, type: 'food', hungerValue: 4, healthValue: -3 },
    'cooked_meat': { name: 'Cooked Meat', icon: 'assets/items/cooked_meat.png', stack: 10, type: 'food', hungerValue: 25, healthValue: 5 },
    'cooked_fish': { name: 'Cooked Fish', icon: 'assets/items/cooked_fish.png', stack: 10, type: 'food', hungerValue: 20, healthValue: 3 },
    
    // Consumables (Drinks, Potions)
    'empty_water_container': { name: 'Empty Water Container', icon: 'assets/items/empty_water_container.png', stack: 5, type: 'container'},
    'filled_water_container': { name: 'Water Container (Full)', icon: 'assets/items/water_container.png', stack: 1, type: 'consumable', thirstValue: 30, emptyTo: 'empty_water_container' },
    'herb_tea': { name: 'Herb Tea', icon: 'assets/items/herb_tea.png', stack: 5, type: 'consumable', thirstValue: 20, healthValue: 10, emptyTo: 'empty_water_container' },


    // Tools
    'wooden_axe': { name: 'Wooden Axe', icon: 'assets/items/wooden_axe.png', stack: 1, type: 'tool', toolType: 'axe', toolStrength: 2, durability: 50, maxDurability: 50 },
    'wooden_pickaxe': { name: 'Wooden Pickaxe', icon: 'assets/items/wooden_pickaxe.png', stack: 1, type: 'tool', toolType: 'pickaxe', toolStrength: 2, durability: 50, maxDurability: 50 },
    'stone_axe': { name: 'Stone Axe', icon: 'assets/items/stone_axe.png', stack: 1, type: 'tool', toolType: 'axe', toolStrength: 4, durability: 100, maxDurability: 100 },
    'stone_pickaxe': { name: 'Stone Pickaxe', icon: 'assets/items/stone_pickaxe.png', stack: 1, type: 'tool', toolType: 'pickaxe', toolStrength: 4, durability: 100, maxDurability: 100 },
    'iron_axe': { name: 'Iron Axe', icon: 'assets/items/iron_axe.png', stack: 1, type: 'tool', toolType: 'axe', toolStrength: 8, durability: 200, maxDurability: 200 },
    'iron_pickaxe': { name: 'Iron Pickaxe', icon: 'assets/items/iron_pickaxe.png', stack: 1, type: 'tool', toolType: 'pickaxe', toolStrength: 8, durability: 200, maxDurability: 200 },
    'torch': { name: 'Torch', icon: 'assets/items/torch.png', stack: 10, type: 'tool', equippable: true, lightSource: { color: 0xffaa33, intensity: 0.8, distance: 12, decay: 2 } }, // Added decay for PointLight

    // Weapons
    'wooden_sword': { name: 'Wooden Sword', icon: 'assets/items/wooden_sword.png', stack: 1, type: 'weapon', damage: 5, durability: 60, maxDurability: 60 },
    'stone_sword': { name: 'Stone Sword', icon: 'assets/items/stone_sword.png', stack: 1, type: 'weapon', damage: 8, durability: 120, maxDurability: 120 },
    'iron_sword': { name: 'Iron Sword', icon: 'assets/items/iron_sword.png', stack: 1, type: 'weapon', damage: 15, durability: 250, maxDurability: 250 },
    'bow': { name: 'Bow', icon: 'assets/items/bow.png', stack: 1, type: 'weapon', damage: 10, range: 30, durability: 80, maxDurability: 80, requiresAmmo: 'arrow' },
    'arrow': { name: 'Arrow', icon: 'assets/items/arrow.png', stack: 20, type: 'ammo' },

    // Armor
    'leather_armor': { name: 'Leather Armor', icon: 'assets/items/leather_armor.png', stack: 1, type: 'armor', defense: 5, slot: 'body', durability: 100, maxDurability: 100 },
    'iron_armor': { name: 'Iron Armor', icon: 'assets/items/iron_armor.png', stack: 1, type: 'armor', defense: 10, slot: 'body', durability: 200, maxDurability: 200 },

    // Placeables / Structures (these are crafted into inventory then placed)
    // The 'id' here is the item ID. 'buildableId' links to BuildingSystem config.
    'campfire_item': { name: 'Campfire Kit', icon: 'assets/structures/campfire.png', stack: 5, type: 'placeable', buildableId: 'campfire' },
    'crafting_table_item': { name: 'Crafting Table Kit', icon: 'assets/structures/crafting_table.png', stack: 5, type: 'placeable', buildableId: 'crafting_table' },
    'forge_item': { name: 'Forge Kit', icon: 'assets/structures/forge.png', stack: 5, type: 'placeable', buildableId: 'forge' },
    'wooden_wall_item': { name: 'Wooden Wall Section', icon: 'assets/structures/wooden_wall.png', stack: 20, type: 'placeable', buildableId: 'wooden_wall' },
    'wooden_floor_item': { name: 'Wooden Floor Section', icon: 'assets/structures/wooden_floor.png', stack: 20, type: 'placeable', buildableId: 'wooden_floor' },
    'wooden_door_item': { name: 'Wooden Doorway', icon: 'assets/structures/wooden_door.png', stack: 5, type: 'placeable', buildableId: 'wooden_door' },
    'storage_box_item': { name: 'Storage Box Kit', icon: 'assets/structures/storage_box.png', stack: 5, type: 'placeable', buildableId: 'storage_box' },

    // Default/Error item
    'unknown': { name: 'Unknown Item', icon: 'assets/items/unknown.png', stack: 1, type: 'unknown' }
};

function getItemData(itemId) {
    const data = ItemData[itemId];
    if (data) {
        // Return a copy to prevent accidental modification of the original data, especially for durability
        return { ...data }; 
    }
    console.warn(`ItemData not found for ID: ${itemId}. Returning 'unknown'.`);
    return { ...ItemData['unknown'] }; // Return a copy of unknown
}