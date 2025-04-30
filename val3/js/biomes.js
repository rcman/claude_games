// Biome system
const biomes = {
    meadows: {
        color: 0x88AA44,
        treeColor: 0x2E7D32,
        treeTypes: ['birch', 'oak'],
        resources: ['stone', 'flint', 'wood'],
        enemies: ['greyling', 'boar', 'deer'],
        noiseThreshold: 0.3
    },
    blackForest: {
        color: 0x334422,
        treeColor: 0x1B5E20,
        treeTypes: ['pine', 'fir'],
        resources: ['copper', 'tin', 'core_wood'],
        enemies: ['greydwarf', 'troll'],
        noiseThreshold: 0.5
    },
    swamp: {
        color: 0x554433,
        treeColor: 0x3E2723,
        treeTypes: ['ancient'],
        resources: ['iron', 'withered_bone', 'ancient_bark'],
        enemies: ['draugr', 'leech'],
        noiseThreshold: 0.7
    },
    mountain: {
        color: 0xEEEEEE,
        treeColor: 0xBDBDBD,
        treeTypes: ['pine'],
        resources: ['silver', 'wolf_fang', 'freeze_gland'],
        enemies: ['wolf', 'drake'],
        noiseThreshold: 0.8
    },
    plains: {
        color: 0xCCBB77,
        treeColor: 0x827717,
        treeTypes: ['birch'],
        resources: ['barley', 'flax', 'black_metal'],
        enemies: ['fuling', 'lox'],
        noiseThreshold: 0.9
    }
};

function getBiomeAt(x, z) {
    // Use noise to determine biome type
    const biomeNoise = Math.abs(perlin.perlin2(x * 0.01, z * 0.01));
    
    // Determine biome based on noise threshold
    if (biomeNoise > biomes.plains.noiseThreshold) {
        return biomes.plains;
    } else if (biomeNoise > biomes.mountain.noiseThreshold) {
        return biomes.mountain;
    } else if (biomeNoise > biomes.swamp.noiseThreshold) {
        return biomes.swamp;
    } else if (biomeNoise > biomes.blackForest.noiseThreshold) {
        return biomes.blackForest;
    } else {
        return biomes.meadows;
    }
}