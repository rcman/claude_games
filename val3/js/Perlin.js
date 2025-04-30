// Simple Perlin Noise implementation
// Based on a simplified adaptation of various open source implementations
const perlin = {
    // Permutation table
    p: new Array(512),
    
    // Initialize with a random seed
    seed: function(seed) {
        if(seed > 0 && seed < 1) {
            // Scale the seed out
            seed *= 65536;
        }
        
        seed = Math.floor(seed);
        if(seed < 256) {
            seed |= seed << 8;
        }
        
        let perm = new Array(256);
        for(let i = 0; i < 256; i++) {
            let v;
            if (i & 1) {
                v = perm[i ^ 0xff];
            } else {
                v = perm[i ^ 0x80];
            }
            
            perm[i] = v;
        }
        
        // Fill the permutation array
        for (let i = 0; i < 256; i++) {
            perm[i] = i;
        }
        
        // Randomize the permutation array
        for (let i = 0; i < 255; i++) {
            const r = i + ~~(seed * (256 - i) / 256);
            const aux = perm[i];
            perm[i] = perm[r];
            perm[r] = aux;
            this.p[i + 256] = this.p[i] = perm[i];
        }
    },
    
    // Linear interpolation
    lerp: function(t, a, b) {
        return a + t * (b - a);
    },
    
    // Fade function for smoother interpolation 
    fade: function(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    },
    
    // Gradient function
    grad: function(hash, x, y, z) {
        // Convert low 4 bits of hash code into 12 gradient directions
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h == 12 || h == 14 ? x : z;
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    },
    
    // 2D perlin noise function
    noise2D: function(x, y) {
        // Find unit grid cell containing point
        let X = Math.floor(x);
        let Y = Math.floor(y);
        
        // Get relative coordinates within that cell
        x = x - X;
        y = y - Y;
        
        // Wrap grid cell coordinates
        X = X & 255;
        Y = Y & 255;
        
        // Calculate hash values for corners
        const n00 = this.grad(this.p[X + this.p[Y]], x, y, 0);
        const n01 = this.grad(this.p[X + this.p[Y + 1]], x, y - 1, 0);
        const n10 = this.grad(this.p[X + 1 + this.p[Y]], x - 1, y, 0);
        const n11 = this.grad(this.p[X + 1 + this.p[Y + 1]], x - 1, y - 1, 0);
        
        // Compute fade curves
        const u = this.fade(x);
        const v = this.fade(y);
        
        // Interpolate x direction
        const nx0 = this.lerp(u, n00, n10);
        const nx1 = this.lerp(u, n01, n11);
        
        // Interpolate y direction
        return this.lerp(v, nx0, nx1);
    },
    
    // 3D perlin noise function
    noise3D: function(x, y, z) {
        // Find unit grid cell containing point
        let X = Math.floor(x);
        let Y = Math.floor(y);
        let Z = Math.floor(z);
        
        // Get relative coordinates within that cell
        x = x - X;
        y = y - Y;
        z = z - Z;
        
        // Wrap grid cell coordinates
        X = X & 255;
        Y = Y & 255;
        Z = Z & 255;
        
        // Calculate hash values for corners
        const A = this.p[X] + Y;
        const AA = this.p[A] + Z;
        const AB = this.p[A + 1] + Z;
        const B = this.p[X + 1] + Y;
        const BA = this.p[B] + Z;
        const BB = this.p[B + 1] + Z;
        
        // Compute fade curves
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        
        // Interpolate results
        return this.lerp(w, 
            this.lerp(v, 
                this.lerp(u, this.grad(this.p[AA], x, y, z), 
                           this.grad(this.p[BA], x-1, y, z)), 
                this.lerp(u, this.grad(this.p[AB], x, y-1, z), 
                           this.grad(this.p[BB], x-1, y-1, z))),
            this.lerp(v, 
                this.lerp(u, this.grad(this.p[AA+1], x, y, z-1), 
                           this.grad(this.p[BA+1], x-1, y, z-1)), 
                this.lerp(u, this.grad(this.p[AB+1], x, y-1, z-1),
                           this.grad(this.p[BB+1], x-1, y-1, z-1))));
    }
};

// Initialize permutation table
for (let i = 0; i < 256; i++) {
    perlin.p[i] = perlin.p[i + 256] = Math.floor(Math.random() * 256);
}