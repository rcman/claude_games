// Setup UI elements
function setupUI() {
    updatePlayerStats();
    messageLogDiv.innerText = ''; 
    messageLogDiv.style.transition = ''; 
    messageLogDiv.style.opacity = 1;
    
    if (messageLogDiv.timeoutId) { 
        clearTimeout(messageLogDiv.timeoutId); 
        messageLogDiv.timeoutId = null; 
    }
}

// Update player stats display
function updatePlayerStats() {
    if (!player || !playerClassInfo || !playerStatsDiv) return;
    
    playerStatsDiv.innerHTML = '';
    let playerInfo = document.createElement('div'); 
    playerInfo.className = 'playerInfo';
    
    let now = gameTime; 
    let timeSinceSpecial = now - player.lastSpecialTime; 
    let specialReady = timeSinceSpecial >= player.specialCooldown;
    let specialCooldownRemaining = Math.max(0, player.specialCooldown - timeSinceSpecial);
    let specialStatus = specialReady ? 
        '<span style="color:lime;">(Ready)</span>' : 
        `<span style="color:yellow;">(${Math.ceil(specialCooldownRemaining / 1000)}s)</span>`;
    
    let healthPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
    let displayHealth = Math.max(0, Math.ceil(player.health));
    
    playerInfo.innerHTML = `
        <div><b>${player.type}</b> (Lvl ${currentLevel})</div>
        <div>Health: ${displayHealth} / ${player.maxHealth}</div>
        <div class="healthBar"><div class="healthFill" style="width: ${healthPercent}%"></div></div>
        <div>Score: ${player.score}</div>
        <div>Keys: ${player.keys}</div>
        <div>Potions: ${player.potions}</div>
        <div>Special: ${player.special} ${specialStatus}</div>
    `;
    
    playerStatsDiv.appendChild(playerInfo);
}

// Show a game message
function showMessage(message, duration = 3000) {
    const fadeDuration = 500; 
    if (duration <= fadeDuration) duration = fadeDuration + 100;
    
    if (messageLogDiv.timeoutId) { 
        clearTimeout(messageLogDiv.timeoutId); 
        messageLogDiv.timeoutId = null; 
    }
    
    messageLogDiv.innerText = message; 
    messageLogDiv.style.transition = ''; 
    messageLogDiv.style.opacity = 1; 
    lastMessageTime = gameTime;
    
    messageLogDiv.timeoutId = activeTimeouts.push(setTimeout(() => {
        messageLogDiv.style.transition = `opacity ${fadeDuration}ms ease-out`; 
        messageLogDiv.style.opacity = 0;
        
        activeTimeouts.push(setTimeout(() => { 
            if (messageLogDiv.style.opacity == 0) {} 
            messageLogDiv.timeoutId = null; 
        }, fadeDuration));
    }, duration - fadeDuration));
}

// Update UI
function updateUI() {
    updatePlayerStats();
}