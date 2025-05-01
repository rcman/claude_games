// UI management
class UIManager {
    constructor(game) {
        this.game = game;
        
        // UI elements
        this.speedometerEl = document.getElementById('speedometer');
        this.damageLevelEl = document.getElementById('damageLevel');
        this.countdownEl = document.getElementById('countdown');
        this.lapEl = document.getElementById('lap');
        this.trackInfoEl = document.getElementById('trackInfo');
        
        // Menu screens
        this.startScreenEl = document.getElementById('startScreen');
        this.menuEl = document.getElementById('menu');
        this.gameOverScreenEl = document.getElementById('gameOverScreen');
        
        // Buttons
        this.startButtonEl = document.getElementById('startButton');
        this.raceButtonEl = document.getElementById('raceButton');
        this.continueButtonEl = document.getElementById('continueButton');
        this.trackMenuItems = document.querySelectorAll('.menuItem');
        
        this.setupButtonHandlers();
    }
    
    setupButtonHandlers() {
        this.startButtonEl.addEventListener('click', () => {
            this.game.setGameState('menu');
            this.startScreenEl.classList.add('hidden');
            this.menuEl.classList.remove('hidden');
        });
        
        this.raceButtonEl.addEventListener('click', () => {
            this.game.startRace();
        });
        
        this.continueButtonEl.addEventListener('click', () => {
            this.game.setGameState('menu');
            this.gameOverScreenEl.classList.add('hidden');
            this.menuEl.classList.remove('hidden');
            this.updateLeagueTable();
        });
        
        this.trackMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                this.trackMenuItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                this.game.trackManager.loadTrack(item.dataset.track);
            });
        });
    }
    
    updateDamageDisplay(damage) {
        const damagePercent = damage * 100;
        this.damageLevelEl.style.width = `${damagePercent}%`;
        
        // Change color based on damage level
        if (damagePercent < 50) {
            this.damageLevelEl.style.backgroundColor = '#f00';
        } else if (damagePercent < 80) {
            this.damageLevelEl.style.backgroundColor = '#f70';
        } else {
            this.damageLevelEl.style.backgroundColor = '#ff0';
        }
        
        // Check for too much damage
        if (damage >= 1) {
            this.game.endRace(true);
        }
    }
    
    updateLap(lap, totalLaps) {
        this.lapEl.textContent = `LAP: ${lap}/${totalLaps}`;
    }
    
    startCountdown(callback) {
        this.menuEl.classList.add('hidden');
        this.countdownEl.classList.remove('hidden');
        let countdown = 3;
        this.countdownEl.textContent = countdown;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.countdownEl.textContent = countdown;
            } else {
                clearInterval(countdownInterval);
                this.countdownEl.textContent = 'GO!';
                
                setTimeout(() => {
                    this.countdownEl.classList.add('hidden');
                    callback(); // Start the race
                }, 1000);
            }
        }, 1000);
    }
    
    showGameOver(result, time, damage, points) {
        // Format race time
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const millis = Math.floor((time % 1000) / 10);
        
        const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}:${millis.toString().padStart(2, '0')}`;
        
        // Show end race screen
        document.getElementById('raceResult').textContent = result;
        document.getElementById('raceStats').innerHTML = `TIME: ${timeFormatted}<br>DAMAGE: ${Math.round(damage * 100)}%<br>POINTS: +${points}`;
        this.gameOverScreenEl.classList.remove('hidden');
    }
    
    updateLeagueTable() {
        // Calculate current standings
        let standings = [
            { name: 'PLAYER', points: this.game.playerPoints },
            { name: 'CPU 1', points: this.game.cpuPoints[0] },
            { name: 'CPU 2', points: this.game.cpuPoints[1] },
            { name: 'CPU 3', points: this.game.cpuPoints[2] }
        ];
        
        // Sort by points
        standings.sort((a, b) => b.points - a.points);
        
        // Update table
        const table = document.getElementById('leagueTable');
        const rows = table.getElementsByTagName('tr');
        
        for (let i = 0; i < standings.length; i++) {
            const cells = rows[i+1].getElementsByTagName('td');
            cells[1].textContent = standings[i].name;
            cells[2].textContent = standings[i].points;
        }
    }
}