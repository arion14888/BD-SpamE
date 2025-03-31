const { ipcRenderer } = require('electron')
const { createBot, disconnectAllBots } = require('./bot.js')

let isRunning = false

const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const statusText = document.getElementById('statusText')
const serverAddress = document.getElementById('serverAddress')
const botCount = document.getElementById('botCount')
const botDelay = document.getElementById('botDelay')
const cycleDelay = document.getElementById('cycleDelay')
const botMessage = document.getElementById('botMessage')
const botNickname = document.getElementById('botNickname')

// Режимы работы
const modes = {
	spam: document.getElementById('spamMode'),
	vote: document.getElementById('voteMode'),
	message: document.getElementById('messageMode'),
}

// Показ/скрытие настроек в зависимости от режима
function updateModeSettings() {
	const messageSettings = document.getElementById('messageSettings')
	messageSettings.classList.remove('active')

	if (modes.message.checked) {
		messageSettings.classList.add('active')
	}
}

// Добавляем слушатели для переключения режимов
Object.values(modes).forEach(mode => {
	mode.addEventListener('change', updateModeSettings)
})

async function startBotCycle() {
	if (isRunning) return

	const [ip, portStr] = serverAddress.value.split(':')
	if (!ip || !portStr) {
		statusText.textContent = 'ОШИБКА: Введите IP:порт'
		statusText.style.color = '#ff0000'
		return
	}

	const port = parseInt(portStr)
	if (isNaN(port)) {
		statusText.textContent = 'ОШИБКА: Неверный порт'
		statusText.style.color = '#ff0000'
		return
	}

	isRunning = true
	updateStatus()

	// Режим болванки (без голосования)
	if (modes.vote.checked) {
		const bots = []
		const botCountValue = parseInt(botCount.value)

		// Создаем указанное количество ботов
		for (let i = 1; i <= botCountValue; i++) {
			if (!isRunning) {
				for (const bot of bots) {
					try {
						bot.Disconnect()
					} catch (error) {}
				}
				await disconnectAllBots()
				return
			}

			try {
				const bot = await createBot(ip, port, botNickname.value)
				bots.push(bot)
				bot.connect()
			} catch (error) {
				console.error('Ошибка при создании бота:', error)
			}
		}

		// Боты остаются подключенными
		while (isRunning) {
			await new Promise(resolve => setTimeout(resolve, 1000))
		}

		// Отключаем ботов при остановке
		for (const bot of bots) {
			try {
				bot.Disconnect()
			} catch (error) {
				console.error('Ошибка при отключении бота:', error)
			}
		}
		await disconnectAllBots()
		updateStatus()
		return
	}

	// Режим сообщений
	else if (modes.message.checked) {
		while (isRunning) {
			const bots = []

			// Создаем и подключаем несколько ботов сразу
			for (let i = 1; i <= parseInt(botCount.value); i++) {
				if (!isRunning) {
					for (const bot of bots) {
						try {
							bot.Disconnect()
						} catch (error) {}
					}
					await disconnectAllBots()
					return
				}

				try {
					const bot = await createBot(ip, port, botNickname.value)
					bots.push(bot)
					bot.connect()
				} catch (error) {
					console.error('Ошибка при создании бота:', error)
				}
			}

			// Ждем подключения всех ботов, отправляем сообщения и отключаемся
			await Promise.all(
				bots.map(bot => {
					return new Promise(resolve => {
						bot.once('connected', async () => {
							if (!isRunning) {
								try {
									await bot.Disconnect()
								} catch (error) {}
								resolve()
								return
							}

							try {
								await bot.game.Say(botMessage.value)
								await bot.Disconnect()
							} catch (error) {
								console.error(
									'Ошибка при отправке сообщения или отключении:',
									error
								)
							}
							resolve()
						})

						// Если таймаут или нажали стоп - отключаем
						setTimeout(() => {
							if (!isRunning) {
								try {
									bot.Disconnect()
								} catch (error) {}
							}
							resolve()
						}, 2000)
					})
				})
			)

			// Задержка перед следующей группой ботов
			if (isRunning) {
				await new Promise(resolve =>
					setTimeout(resolve, parseInt(cycleDelay.value))
				)
			}
		}
	}

	// Режим спама (оставляем как есть)
	else {
		while (isRunning) {
			const bots = []

			for (let i = 1; i <= parseInt(botCount.value); i++) {
				if (!isRunning) {
					for (const bot of bots) {
						try {
							bot.Disconnect()
						} catch (error) {}
					}
					await disconnectAllBots()
					return
				}

				try {
					const bot = await createBot(ip, port, botNickname.value)
					bots.push(bot)
					bot.connect()
					await new Promise(resolve =>
						setTimeout(resolve, parseInt(botDelay.value))
					)
				} catch (error) {
					console.error('Ошибка при создании бота:', error)
				}
			}

			if (!isRunning) {
				for (const bot of bots) {
					try {
						bot.Disconnect()
					} catch (error) {
						console.error('Ошибка при отключении бота:', error)
					}
				}
				await disconnectAllBots()
				return
			}

			await new Promise(resolve =>
				setTimeout(resolve, parseInt(cycleDelay.value))
			)

			for (const bot of bots) {
				try {
					bot.Disconnect()
				} catch (error) {
					console.error('Ошибка при отключении бота:', error)
				}
			}

			if (!isRunning) {
				await disconnectAllBots()
				return
			}

			if (isRunning) {
				await new Promise(resolve => setTimeout(resolve, 10))
			}
		}
	}

	updateStatus()
}

async function stopBotCycle() {
	isRunning = false
	updateStatus()

	// Агрессивное отключение всех ботов
	for (let i = 0; i < 5; i++) {
		await disconnectAllBots()
		await new Promise(resolve => setTimeout(resolve, 100))
	}

	ipcRenderer.send('disconnect-all-bots')
}

function updateStatus() {
	statusText.textContent = isRunning ? 'ЗАПУЩЕНО' : 'ОСТАНОВЛЕНО'
	const statusDisplay = document.querySelector('.status-display')
	statusDisplay.dataset.status = isRunning ? 'running' : 'stopped'
}

startBtn.addEventListener('click', startBotCycle)
stopBtn.addEventListener('click', stopBotCycle)

// Инициализация
updateStatus()
updateModeSettings()

// Обработка закрытия окна
window.addEventListener('beforeunload', () => {
	if (isRunning) {
		stopBotCycle()
	}
})
