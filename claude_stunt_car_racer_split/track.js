// Track management
class TrackManager {
    constructor(game) {
        this.game = game;
        this.tracks = {};
        this.currentTrack = null;
        this.checkpoints = [];
        
        this.initTracks();
    }
    
    initTracks() {
        // Little Ramp
        this.tracks['little-ramp'] = {
            name: 'LITTLE RAMP',
            difficulty: 1,
            segments: []
        };
        
        // Initialize with a simple track for demonstration
        this.tracks['little-ramp'].segments = this.createRampTrack();
        
        // Create simplified versions of the other tracks
        this.tracks['stepping-stones'] = {
            name: 'STEPPING STONES',
            difficulty: 2,
            segments: this.createRampTrack() // Placeholder - would be different for actual implementation
        };
        
        this.tracks['hump-back'] = {
            name: 'HUMP BACK',
            difficulty: 3,
            segments: this.createRampTrack() // Placeholder - would be different for actual implementation
        };
        
        // Set up checkpoints for each track
        this.setupCheckpoints();
        
        // Load the default track
        this.loadTrack('little-ramp');
    }
    
    createRampTrack() {
        const segments = [];
        const trackLength = 100;
        const trackWidth = 6;
        
        // Start segment (flat)
        for (let i = 0; i < 10; i++) {
            segments.push({
                points: [
                    { x: -trackWidth/2, y: i * 5, z: 0 },
                    { x: trackWidth/2, y: i * 5, z: 0 },
                    { x: trackWidth/2, y: (i+1) * 5, z: 0 },
                    { x: -trackWidth/2, y: (i+1) * 5, z: 0 }
                ],
                color: '#666'
            });
        }
        
        // Ramp up
        for (let i = 0; i < 5; i++) {
            const height = i * 1;
            segments.push({
                points: [
                    { x: -trackWidth/2, y: (i+10) * 5, z: (i) * 1 },
                    { x: trackWidth/2, y: (i+10) * 5, z: (i) * 1 },
                    { x: trackWidth/2, y: (i+11) * 5, z: (i+1) * 1 },
                    { x: -trackWidth/2, y: (i+11) * 5, z: (i+1) * 1 }
                ],
                color: '#a55'
            });
        }
        
        // Flat top
        for (let i = 0; i < 5; i++) {
            segments.push({
                points: [
                    { x: -trackWidth/2, y: (i+15) * 5, z: 5 },
                    { x: trackWidth/2, y: (i+15) * 5, z: 5 },
                    { x: trackWidth/2, y: (i+16) * 5, z: 5 },
                    { x: -trackWidth/2, y: (i+16) * 5, z: 5 }
                ],
                color: '#666'
            });
        }
        
        // Ramp down
        for (let i = 0; i < 5; i++) {
            const height = 5 - i * 1;
            segments.push({
                points: [
                    { x: -trackWidth/2, y: (i+20) * 5, z: (5-i) },
                    { x: trackWidth/2, y: (i+20) * 5, z: (5-i) },
                    { x: trackWidth/2, y: (i+21) * 5, z: (5-i-1) },
                    { x: -trackWidth/2, y: (i+21) * 5, z: (5-i-1) }
                ],
                color: '#a55'
            });
        }
        
        // End segment (flat)
        for (let i = 0; i < 10; i++) {
            segments.push({
                points: [
                    { x: -trackWidth/2, y: (i+25) * 5, z: 0 },
                    { x: trackWidth/2, y: (i+25) * 5, z: 0 },
                    { x: trackWidth/2, y: (i+26) * 5, z: 0 },
                    { x: -trackWidth/2, y: (i+26) * 5, z: 0 }
                ],
                color: '#666'
            });
        }
        
        // Create a corner segment
        const cornerSegmentCount = 10;
        const cornerRadius = 20;
        for (let i = 0; i < cornerSegmentCount; i++) {
            const angle1 = (i / cornerSegmentCount) * Math.PI / 2;
            const angle2 = ((i + 1) / cornerSegmentCount) * Math.PI / 2;
            
            const x1 = cornerRadius * Math.cos(angle1);
            const y1 = cornerRadius * Math.sin(angle1);
            const x2 = cornerRadius * Math.cos(angle2);
            const y2 = cornerRadius * Math.sin(angle2);
            
            segments.push({
                points: [
                    { x: x1 - trackWidth/2, y: (35) * 5 + y1, z: 0 },
                    { x: x1 + trackWidth/2, y: (35) * 5 + y1, z: 0 },
                    { x: x2 + trackWidth/2, y: (35) * 5 + y2, z: 0 },
                    { x: x2 - trackWidth/2, y: (35) * 5 + y2, z: 0 }
                ],
                color: '#666'
            });
        }
        
        // Return to start - horizontal path
        for (let i = 0; i < 15; i++) {
            segments.push({
                points: [
                    { x: cornerRadius + i * 5, y: (35) * 5 + cornerRadius, z: 0 },
                    { x: cornerRadius + i * 5, y: (35) * 5 + cornerRadius - trackWidth, z: 0 },
                    { x: cornerRadius + (i+1) * 5, y: (35) * 5 + cornerRadius - trackWidth, z: 0 },
                    { x: cornerRadius + (i+1) * 5, y: (35) * 5 + cornerRadius, z: 0 }
                ],
                color: '#666'
            });
        }
        
        // Another corner to get back to start
        for (let i = 0; i < cornerSegmentCount; i++) {
            const angle1 = Math.PI/2 + (i / cornerSegmentCount) * Math.PI / 2;
            const angle2 = Math.PI/2 + ((i + 1) / cornerSegmentCount) * Math.PI / 2;
            
            const x1 = cornerRadius * Math.cos(angle1);
            const y1 = cornerRadius * Math.sin(angle1);
            const x2 = cornerRadius * Math.cos(angle2);
            const y2 = cornerRadius * Math.sin(angle2);
            
            segments.push({
                points: [
                    { x: cornerRadius + 15 * 5 + x1, y: (35) * 5 + y1, z: 0 },
                    { x: cornerRadius + 15 * 5 + x1, y: (35) * 5 + y1 - trackWidth, z: 0 },
                    { x: cornerRadius + 15 * 5 + x2, y: (35) * 5 + y2 - trackWidth, z: 0 },
                    { x: cornerRadius + 15 * 5 + x2, y: (35) * 5 + y2, z: 0 }
                ],
                color: '#666'
            });
        }
        
        // Vertical path back to start
        for (let i = 0; i < 35; i++) {
            segments.push({
                points: [
                    { x: cornerRadius + 15 * 5, y: (35 - i) * 5, z: 0 },
                    { x: cornerRadius + 15 * 5 - trackWidth, y: (35 - i) * 5, z: 0 },
                    { x: cornerRadius + 15 * 5 - trackWidth, y: (35 - i - 1) * 5, z: 0 },
                    { x: cornerRadius + 15 * 5, y: (35 - i - 1) * 5, z: 0 }
                ],
                color: '#666'
            });
        }
        
        return segments;
    }
    
    setupCheckpoints() {
        // For simplicity, create checkpoints at regular intervals
        // In a full implementation, these would be carefully placed
        this.checkpoints = [];
        const segmentCount = this.tracks['little-ramp'].segments.length;
        const checkpointCount = 8;
        
        for (let i = 0; i < checkpointCount; i++) {
            const segmentIndex = Math.floor(i * segmentCount / checkpointCount);
            this.checkpoints.push(segmentIndex);
        }
    }
    
    loadTrack(trackId) {
        this.currentTrack = this.tracks[trackId];
        document.getElementById('trackInfo').textContent = `TRACK: ${this.currentTrack.name}`;
    }
    
    // Get track height at position
    getTrackHeightAt(position) {
        // Find current segment
        const currentSegmentIndex = Math.floor(position.y / 5) % this.currentTrack.segments.length;
        const nextSegmentIndex = (currentSegmentIndex + 1) % this.currentTrack.segments.length;
        
        const currentSegment = this.currentTrack.segments[currentSegmentIndex];
        const nextSegment = this.currentTrack.segments[nextSegmentIndex];
        
        // Interpolate between segments to find track height at position
        const segmentLength = 5;
        const segmentProgress = (position.y % segmentLength) / segmentLength;
        
        // Calculate track height at position using linear interpolation between segments
        const p1 = currentSegment.points[0];
        const p2 = currentSegment.points[3];
        const p3 = nextSegment.points[0];
        const p4 = nextSegment.points[3];
        
        const h1 = (p1.z + p2.z) / 2;
        const h2 = (p3.z + p4.z) / 2;
        
        return h1 + segmentProgress * (h2 - h1);
    }
    
    // Check if position is within track width
    isWithinTrackWidth(position) {
        const halfTrackWidth = 3; // Half the track width
        return Math.abs(position.x) <= halfTrackWidth;
    }
}