// Graphics rendering engine
class Renderer {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setCanvasSize();
        
        // Set up resize event listener
        window.addEventListener('resize', () => {
            this.setCanvasSize();
        });
    }
    
    setCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.aspectRatio = this.canvas.width / this.canvas.height;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sky
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height/2);
        gradient.addColorStop(0, '#00a');
        gradient.addColorStop(1, '#88f');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height/2);
        
        // Ground
        this.ctx.fillStyle = '#3a3';
        this.ctx.fillRect(0, this.canvas.height/2, this.canvas.width, this.canvas.height/2);
        
        // Render track
        this.renderTrack();
    }
    
    renderTrack() {
        const trackManager = this.game.trackManager;
        if (!trackManager.currentTrack) return;
        
        // Sort segments by distance from car for painter's algorithm
        const sortedSegments = [...trackManager.currentTrack.segments];
        const carSegmentIndex = Math.floor(this.game.physics.car.position.y / 5) % sortedSegments.length;
        
        // Rearrange array to start with segments behind the car
        const reorderedSegments = [
            ...sortedSegments.slice(carSegmentIndex + 50),
            ...sortedSegments.slice(0, carSegmentIndex + 50)
        ];
        
        // Render segments from far to near
        for (let i = 0; i < reorderedSegments.length; i++) {
            const segment = reorderedSegments[i];
            this.renderSegment(segment);
        }
    }
    
    renderSegment(segment) {
        // Transform segment points to camera space
        const transformedPoints = segment.points.map(point => this.transformPoint(point));
        
        // Check if segment is visible
        const isVisible = transformedPoints.some(p => p.z > 0);
        if (!isVisible) return;
        
        // Project points to 2D screen space
        const screenPoints = transformedPoints.map(point => this.projectPoint(point));
        
        // Check if all points are within view
        const allPointsInView = screenPoints.every(p => 
            p.x >= 0 && p.x <= this.canvas.width && 
            p.y >= 0 && p.y <= this.canvas.height
        );
        
        // Draw segment
        this.ctx.beginPath();
        this.ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        
        for (let i = 1; i < screenPoints.length; i++) {
            this.ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
        }
        
        this.ctx.closePath();
        
        // Fill with track color
        this.ctx.fillStyle = segment.color;
        this.ctx.fill();
        
        // Draw wireframe outline for the classic Stunt Car Racer look
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    transformPoint(point) {
        const car = this.game.physics.car;
        const camera = this.game.physics.getCameraInfo();
        
        // Translate relative to car
        const translatedPoint = {
            x: point.x - car.position.x,
            y: point.y - car.position.y,
            z: point.z - car.position.z
        };
        
        // Rotate around Y axis (car steering)
        const rotY = -car.rotation.y;
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        
        const rotatedPoint = {
            x: translatedPoint.x * cosY - translatedPoint.y * sinY,
            y: translatedPoint.x * sinY + translatedPoint.y * cosY,
            z: translatedPoint.z
        };
        
        // Adjust for camera position
        const cameraPoint = {
            x: rotatedPoint.x,
            y: rotatedPoint.y - camera.distance,
            z: rotatedPoint.z - camera.height
        };
        
        return cameraPoint;
    }
    
    projectPoint(point) {
        const camera = this.game.physics.getCameraInfo();
        
        // Avoid division by zero
        const z = Math.max(0.1, point.z);
        
        // Calculate perspective projection
        const scale = camera.fov / z;
        
        // Project to screen coordinates
        return {
            x: this.canvas.width / 2 + point.x * scale * this.canvas.height,
            y: this.canvas.height / 2 - point.y * scale * this.canvas.height
        };
    }
}