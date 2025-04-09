document.addEventListener('DOMContentLoaded', function() {
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const messageSettings = document.getElementById('messageSettings');
    const aboutSettings = document.getElementById('aboutSettings');
    const turboToggle = document.getElementById('turboToggle');
    const enableMessage = document.getElementById('enableMessage');
    const messageContent = document.getElementById('messageContent');
    const telegramBtn = document.getElementById('telegramBtn');
    const websiteBtn = document.getElementById('websiteBtn');

    let originalMessageState = enableMessage.checked;

    turboToggle.addEventListener('change', function() {
        if (this.checked) {
            originalMessageState = enableMessage.checked;
            document.getElementById('enableMessageContainer').style.display = 'none';
            messageContent.style.display = 'none';
            showTurboTooltip();
        } else {
            document.getElementById('enableMessageContainer').style.display = 'flex';
            enableMessage.checked = originalMessageState;
            messageContent.style.display = originalMessageState ? 'block' : 'none';
        }
    });

    enableMessage.addEventListener('change', function() {
        if (!turboToggle.checked) {
            messageContent.style.display = this.checked ? 'block' : 'none';
        }
    });

    telegramBtn.addEventListener('click', () => {
        const { shell } = require('electron');
        shell.openExternal('https://t.me/BlackDDNet');
    });

    websiteBtn.addEventListener('click', () => {
        const { shell } = require('electron');
        shell.openExternal('https://arion14888.github.io/BD-Site/');
    });

    modeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            messageSettings.style.display = 'none';
            aboutSettings.style.display = 'none';

            if (this.value === 'message') {
                messageSettings.style.display = 'block';
            } else if (this.value === 'about') {
                aboutSettings.style.display = 'block';
            }
        });
    });

    document.querySelector('input[name="mode"]:checked').dispatchEvent(new Event('change'));
});

const { ipcRenderer } = require('electron');
const { createBot, disconnectAllBots } = require('./bot.js');

let isRunning = false;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusText = document.getElementById('statusText');
const serverAddress = document.getElementById('serverAddress');
const botCount = document.getElementById('botCount');
const botDelay = document.getElementById('botDelay');
const cycleDelay = document.getElementById('cycleDelay');
const botMessage = document.getElementById('botMessage');
const botNickname = document.getElementById('botNickname');
const enableMessage = document.getElementById('enableMessage');
const turboToggle = document.getElementById('turboToggle');

const modes = {
    message: document.getElementById('messageMode'),
    about: document.getElementById('aboutMode')
};

startBtn.addEventListener('click', startBotCycle);
stopBtn.addEventListener('click', stopBotCycle);

async function startBotCycle() {
    if (isRunning) return;

    if (modes.about.checked) {
        const { shell } = require('electron');
        shell.openExternal('https://t.me/BlackDDNet');
        return;
    }

    isRunning = true;
    updateStatus();
    startBtn.disabled = true;
    stopBtn.disabled = false;

    try {
        const [ip, port] = parseServer(serverAddress.value);
        if (!ip || !port) {
            throw new Error('Invalid server address');
        }

        if (modes.message.checked) {
            if (turboToggle.checked) {
                await cycleJoinLeaveMode(ip, port);
            } else {
                await runMessageMode(ip, port);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (!isRunning) {
            updateStatus();
        }
    }
}

function parseServer(address) {
    if (!address) return [null, null];
    const [ip, portStr] = address.split(':');
    const port = parseInt(portStr);
    return isNaN(port) ? [null, null] : [ip, port];
}

async function runMessageMode(ip, port) {
    while (isRunning) {
        const bots = [];
        const maxBots = parseInt(botCount.value);

        try {
            for (let i = 1; i <= maxBots && isRunning; i++) {
                try {
                    const bot = await createBot(ip, port, botNickname.value);
                    
                    bot.once('connected', async () => {
                        try {
                            await new Promise(r => setTimeout(r, 100));
                            bot.sendInput();
                            
                            if (enableMessage.checked && botMessage.value) {
                                try {
                                    await bot.game?.Say?.(botMessage.value) || await bot.sendMessage?.(botMessage.value);
                                } catch {}
                            }
                            
                            await new Promise(r => setTimeout(r, parseInt(botDelay.value)));
                            await bot.Disconnect();
                        } catch {
                            try { await bot.Disconnect(); } catch {}
                        }
                    });
                    
                    bot.connect();
                    bots.push(bot);
                    await new Promise(r => setTimeout(r, 15));
                } catch (error) {
                    console.error('Bot creation error:', error);
                }
            }

            await new Promise(r => setTimeout(r, 500));
            await disconnectBots(bots);
            if (isRunning) await new Promise(r => setTimeout(r, parseInt(cycleDelay.value)));
        } catch (error) {
            console.error('Error:', error);
            await disconnectBots(bots);
        }
    }
}

async function cycleJoinLeaveMode(ip, port) {
    const maxBots = parseInt(botCount.value);
    const delayValue = parseInt(botDelay.value);
    const cycleDelayValue = parseInt(cycleDelay.value);
    
    try {
        while (isRunning) {
            const botPromises = [];
            
            for (let i = 0; i < maxBots && isRunning; i++) {
                const botPromise = (async () => {
                    try {
                        const bot = await createBot(ip, port, botNickname.value);
                        
                        bot.once('connected', () => {
                            bot.sendInput();
                        });
                        
                        bot.connect();
                        await new Promise(resolve => setTimeout(resolve, Math.min(50, delayValue)));
                        await bot.Disconnect();
                    } catch (error) {
                        console.error('Error:', error);
                    }
                })();
                
                botPromises.push(botPromise);
                
                if (isRunning) {
                    await new Promise(r => setTimeout(r, Math.min(10, delayValue / 10)));
                }
            }
            
            await Promise.all(botPromises);
            await disconnectAllBots();
            
            if (isRunning && cycleDelayValue > 0) {
                await new Promise(resolve => setTimeout(resolve, cycleDelayValue));
            }
        }
    } finally {
        await disconnectAllBots();
    }
}

function showTurboTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'turbo-tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-header">ВНИМАНИЕ!</div>
        <div class="tooltip-content">
            <p>ТУРБО РЕЖИМ</p>
            <p>РАБОТАЕТ НЕ НА ВСЕХ СЕРВЕРАХ!!!!</p>
        </div>
    `;
    document.body.appendChild(tooltip);
    setTimeout(() => tooltip.remove(), 2000);
}

async function disconnectBots(bots) {
    if (!bots || bots.length === 0) return;
    await Promise.all(bots.map(bot => 
        bot?.Disconnect?.().catch(() => {})
    ));
}

async function stopBotCycle() {
    isRunning = false;
    updateStatus();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    await disconnectAllBots();
}

function updateStatus() {
    statusText.textContent = isRunning ? 'ЗАПУЩЕНО' : 'ОСТАНОВЛЕНО';
    statusText.className = isRunning ? 'status-display status-running' : 'status-display status-stopped';
}

window.addEventListener('beforeunload', () => {
    if (isRunning) {
        stopBotCycle();
    }
});
