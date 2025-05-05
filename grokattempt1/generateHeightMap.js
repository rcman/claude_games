// This file is missing from your provided code but referenced in world.js
// Creating a simple procedural height map generator

function getHeightMapDataURL() {
    try {
        const canvas = document.createElement('canvas');
        const width = 256;
        const height = 256;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Generate a simple procedural height map
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                // Simple Perlin-like noise (simplified for demonstration)
                const value = Math.sin(x/20) * Math.cos(y/20) * 0.5 + 0.5;
                
                // Convert to grayscale
                const color = Math.floor(value * 255);
                ctx.fillStyle = `rgb(${color},${color},${color})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        return canvas.toDataURL('image/png');
    } catch (e) {
        console.error("Error generating height map:", e);
        throw e;
    }
}

// Expose to window
window.getHeightMapDataURL = getHeightMapDataURL;