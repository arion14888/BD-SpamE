const { ipcRenderer } = require('electron')
const { createBot, disconnectAllBots } = require('./bot.js')

// Флаги состояния
let isRunning = false

// Кэшируем DOM элементы для быстрого доступа
const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const statusText = document.getElementById('statusText')
const serverAddress = document.getElementById('serverAddress')
const botCount = document.getElementById('botCount')
const botDelay = document.getElementById('botDelay')
const cycleDelay = document.getElementById('cycleDelay')
const botMessage = document.getElementById('botMessage')
const botNickname = document.getElementById('botNickname')

// Элементы для режима рассылки
const broadcastMessage = document.getElementById('broadcastMessage')
const serverList = document.getElementById('serverList')
const broadcastDelay = document.getElementById('broadcastDelay')
const broadcastCycleToggle = document.getElementById('broadcastCycleToggle')
const charCount = document.getElementById('charCount')

// Режимы работы
const modes = {
	spam: document.getElementById('spamMode'),
	vote: document.getElementById('voteMode'),
	message: document.getElementById('messageMode'),
	broadcast: document.getElementById('broadcastMode')
}

// Добавляем слушатели для переключения режимов
Object.values(modes).forEach(mode => {
	mode.addEventListener('change', updateModeSettings)
})

// Обновляем счетчик символов для поля рассылки
broadcastMessage.addEventListener('input', updateCharCount)

function updateCharCount() {
	const count = broadcastMessage.value.length
	charCount.textContent = count
	
	// Подсветка, если приближается к лимиту
	if (count > 115) {
		charCount.style.color = '#ff5722'
	} else if (count > 100) {
		charCount.style.color = '#ff9800'
	} else {
		charCount.style.color = '#666'
	}
}

// Показ/скрытие настроек в зависимости от режима
function updateModeSettings() {
	const messageSettings = document.getElementById('messageSettings')
	const broadcastSettings = document.getElementById('broadcastSettings')
	const settingsSection = document.querySelector('.settings-section')
	const bodyElement = document.body
	
	// Скрываем все специфические настройки
	messageSettings.classList.remove('active')
	broadcastSettings.classList.remove('active')
	
	// Удаляем классы модификаторы
	settingsSection.classList.remove('broadcast-active')
	bodyElement.classList.remove('broadcast-active-mode')
	
	// Показываем только настройки для выбранного режима
	if (modes.message.checked) {
		messageSettings.classList.add('active')
	} else if (modes.broadcast.checked) {
		broadcastSettings.classList.add('active')
		// Добавляем классы для режима рассылки
		settingsSection.classList.add('broadcast-active')
		bodyElement.classList.add('broadcast-active-mode')
	}
	
	updateCharCount()
}

/**
 * Основная функция цикла создания ботов
 */
async function startBotCycle() {
	if (isRunning) return

	// Обновляем интерфейс и запускаем выбранный режим
	isRunning = true
	updateStatus()

	try {
		// Запускаем соответствующий режим
		if (modes.vote.checked) {
			const [ip, port] = parseServer(serverAddress.value)
			if (!ip || !port) {
				throw new Error('Неверный адрес сервера')
			}
			await runDummyMode(ip, port)
		} else if (modes.message.checked) {
			const [ip, port] = parseServer(serverAddress.value)
			if (!ip || !port) {
				throw new Error('Неверный адрес сервера')
			}
			await runMessageMode(ip, port)
		} else if (modes.broadcast.checked) {
			await runBroadcastMode()
		} else {
			const [ip, port] = parseServer(serverAddress.value)
			if (!ip || !port) {
				throw new Error('Неверный адрес сервера')
			}
			await runSpamMode(ip, port)
		}
	} catch (error) {
		console.error('Ошибка в цикле ботов:', error)
	} finally {
		// Обновляем состояние интерфейса
		isRunning = false
		updateStatus()
	}
}

/**
 * Парсинг адреса сервера в формате ip:port
 */
function parseServer(address) {
	const [ip, portStr] = address.split(':')
	if (!ip || !portStr) {
		return [null, null]
	}

	const port = parseInt(portStr)
	if (isNaN(port)) {
		return [null, null]
	}
	
	return [ip, port]
}

/**
 * Режим болванки/голосования (DDNet режим)
 */
async function runDummyMode(ip, port) {
		const bots = []
	const maxBots = parseInt(botCount.value)
	
	// Оптимизированное создание ботов
	try {
		// Создаем ботов с оптимальными задержками
		for (let i = 1; i <= maxBots; i++) {
			if (!isRunning) break

			try {
				const bot = await createBot(ip, port, botNickname.value)
				
				// Настраиваем голосование, если нужно
				if (botMessage.value.startsWith('/vote ')) {
					const voteOption = botMessage.value.slice(6).trim()
					
					bot.once('connected', async () => {
						try {
							// Задержка перед голосованием зависит от позиции бота
							const delay = 300 + (i % 5) * 20
							await new Promise(r => setTimeout(r, delay))
							
							// Используем оптимизированный метод голосования
							await bot.vote(voteOption)
						} catch (err) {}
					})
				}
				
				// Подключаем бота и добавляем в массив
				bot.connect()
				bots.push(bot)
				
				// Минимальная задержка между созданиями ботов
				if (i % 5 === 0) {
					await new Promise(r => setTimeout(r, 10))
				}
			} catch (error) {
				console.error('Ошибка при создании бота:', error)
			}
		}

		// Поддерживаем ботов подключенными
		while (isRunning) {
			await new Promise(r => setTimeout(r, 200))
		}
	} finally {
		// Отключаем ботов при завершении режима
		await disconnectBots(bots)
		await disconnectAllBots()
	}
}

/**
 * Режим отправки сообщений
 */
async function runMessageMode(ip, port) {
		while (isRunning) {
			const bots = []
		const maxBots = parseInt(botCount.value)
		
		try {
			// Создаем ботов с оптимальными задержками
			for (let i = 1; i <= maxBots; i++) {
				if (!isRunning) break

				try {
					const bot = await createBot(ip, port, botNickname.value)
					
					// Настраиваем обработчик подключения
						bot.once('connected', async () => {
							if (!isRunning) {
							try { await bot.Disconnect() } catch (err) {}
								return
							}

						try {
							// Ждем немного после подключения
							await new Promise(resolve => setTimeout(resolve, 100))
							
							// Обязательно вызываем sendInput перед отправкой сообщения
							bot.sendInput()
							
							// Отправляем сообщение надежным способом
							let messageSent = false
							try {
								await bot.game.Say(botMessage.value)
								messageSent = true
							} catch (error) {
								// Вторая попытка через специальный метод
								try {
									messageSent = await bot.sendMessage(botMessage.value)
								} catch (err) {}
							}
							
							// Остаемся подключенными заданное пользователем время
							await new Promise(resolve => setTimeout(resolve, parseInt(botDelay.value)))
							
							// Отключаемся
							await bot.Disconnect()
						} catch (error) {
							try { await bot.Disconnect() } catch (err) {}
						}
					})
					
					// Таймаут на подключение
					setTimeout(() => {
						if (bot.isConnected && !bot.isConnected()) {
							try { bot.Disconnect() } catch (err) {}
						}
					}, 3000)
					
					// Подключаем бота и добавляем в массив
					bot.connect()
					bots.push(bot)
					
					// Небольшая задержка между созданиями ботов
					await new Promise(r => setTimeout(r, 15))
				} catch (error) {
					console.error('Ошибка при создании бота:', error)
				}
			}

			// Основное время ожидания для прохождения цикла - не используем отдельную задержку,
			// а полагаемся на ожидание в обработчике connected, которое базируется на botDelay
			// Это исправляет проблему с большой задержкой между окончанием цикла и началом нового

			// Только короткое дополнительное ожидание для гарантии отключения всех ботов
			await new Promise(r => setTimeout(r, 500))
			
			// Отключаем оставшихся ботов
			await disconnectBots(bots)
			
			// Задержка cycleDelay между циклами, которую указал пользователь
			if (isRunning) {
				await new Promise(r => setTimeout(r, parseInt(cycleDelay.value)))
			}
					} catch (error) {
			console.error('Ошибка в режиме сообщений:', error)
			await disconnectBots(bots)
			await disconnectAllBots()
		}
	}
}

/**
 * Режим спама (быстрый)
 */
async function runSpamMode(ip, port) {
	while (isRunning) {
		const bots = []
		const maxBots = parseInt(botCount.value)
		let connectCount = 0
		
		try {
			// Быстрое создание ботов небольшими группами для максимальной производительности
			const batchSize = Math.min(10, Math.max(1, Math.floor(maxBots / 5)))
			
			for (let start = 0; start < maxBots; start += batchSize) {
				if (!isRunning) break
				
				const end = Math.min(start + batchSize, maxBots)
				const batchPromises = []
				
				// Создаем группу ботов параллельно
				for (let i = start; i < end; i++) {
					batchPromises.push((async () => {
						try {
							const bot = await createBot(ip, port, botNickname.value)
							
							// Счетчик подключений
							bot.once('connected', () => {
								connectCount++
								bot.sendInput() // Важно вызвать для регистрации
							})
							
							bot.connect()
							bots.push(bot)
							
							return bot
						} catch (e) {
							return null
						}
					})())
				}
				
				// Ждем создания группы ботов
				await Promise.all(batchPromises)
				
				// Небольшая задержка между группами
				await new Promise(r => setTimeout(r, 5))
			}
			
			// Задержка для подключения
			const waitTime = Math.min(parseInt(botDelay.value) / 2, 300)
			await new Promise(r => setTimeout(r, waitTime))
			
			// Задержка между подключением и отключением
			await new Promise(r => setTimeout(r, parseInt(botDelay.value) - waitTime))
			
			// Отключаем ботов небольшими группами для стабильности
			const disconnectBatchSize = 20
			for (let i = 0; i < bots.length; i += disconnectBatchSize) {
				const batch = bots.slice(i, i + disconnectBatchSize)
				await disconnectBots(batch)
				if (i + disconnectBatchSize < bots.length) {
					await new Promise(r => setTimeout(r, 5))
				}
			}
			
			// Задержка перед следующим циклом
			if (isRunning) {
				await new Promise(r => setTimeout(r, parseInt(cycleDelay.value)))
			}
		} catch (error) {
			console.error('Ошибка в режиме спама:', error)
			await disconnectBots(bots)
			await disconnectAllBots()
		}
	}
}

/**
 * Функция для надежного отключения группы ботов
 */
async function disconnectBots(bots) {
	if (!bots || bots.length === 0) return
	
	// Отключаем всех ботов параллельно
	await Promise.all(
		bots.map(bot => new Promise(resolve => {
			try { 
				if (bot && typeof bot.Disconnect === 'function') {
					bot.Disconnect()
				}
			} catch (e) {}
			resolve()
		}))
	)
}

/**
 * Функция остановки всех ботов
 */
async function stopBotCycle() {
	isRunning = false
	updateStatus()

	// Отключаем всех ботов несколько раз для надежности
	for (let i = 0; i < 3; i++) {
		await disconnectAllBots()
		await new Promise(r => setTimeout(r, 50))
	}

	ipcRenderer.send('disconnect-all-bots')
}

/**
 * Обновление состояния интерфейса
 */
function updateStatus() {
	statusText.textContent = isRunning ? 'ЗАПУЩЕНО' : 'ОСТАНОВЛЕНО'
	const statusDisplay = document.querySelector('.status-display')
	statusDisplay.dataset.status = isRunning ? 'running' : 'stopped'
}

// Кнопки для модальных окон
const openMessageBtn = document.getElementById('openMessageBtn')
const openServerListBtn = document.getElementById('openServerListBtn')
const saveMessageBtn = document.getElementById('saveMessageBtn')
const saveServerListBtn = document.getElementById('saveServerListBtn')

// Модальные окна
const messageModal = document.getElementById('messageModal')
const serverListModal = document.getElementById('serverListModal')

// Кнопки закрытия модальных окон
const closeButtons = document.querySelectorAll('.close')

// Хранилище данных для рассылки
const broadcastData = {
	message: 'Привет! Это тестовое сообщение для рассылки.',
	serverList: [],
	cycleMode: false
}

// Функции для сохранения и загрузки данных рассылки
function saveBroadcastData() {
	localStorage.setItem('broadcastData', JSON.stringify(broadcastData))
	console.log('Данные рассылки сохранены')
}

function loadBroadcastData() {
	try {
		const savedData = localStorage.getItem('broadcastData')
		if (savedData) {
			const parsedData = JSON.parse(savedData)
			
			// Обновляем данные
			broadcastData.message = parsedData.message || broadcastData.message
			broadcastData.serverList = Array.isArray(parsedData.serverList) 
				? parsedData.serverList 
				: []
			broadcastData.cycleMode = Boolean(parsedData.cycleMode)
				
			console.log('Данные рассылки загружены')
			return true
		}
	} catch (error) {
		console.error('Ошибка при загрузке данных рассылки:', error)
	}
	return false
}

// Обработчики для открытия модальных окон
openMessageBtn.addEventListener('click', () => {
	// Устанавливаем текущее сообщение в поле ввода
	broadcastMessage.value = broadcastData.message
	updateCharCount()
	
	// Показываем модальное окно
	messageModal.style.display = 'block'
})

openServerListBtn.addEventListener('click', () => {
	// Если есть список серверов, показываем его
	if (broadcastData.serverList.length > 0) {
		serverList.value = broadcastData.serverList.join('\n')
	}
	
	// Показываем модальное окно
	serverListModal.style.display = 'block'
})

// Обработчики для сохранения данных
saveMessageBtn.addEventListener('click', () => {
	// Сохраняем сообщение
	broadcastData.message = broadcastMessage.value.trim()
	
	// Устанавливаем текст на кнопке, чтобы было видно, что сообщение задано
	const messageLength = broadcastData.message.length
	openMessageBtn.innerHTML = `
		<span class="btn-icon">✉</span>
		<span class="btn-label">Сообщение (${messageLength})</span>
	`
	
	// Сохраняем данные
	saveBroadcastData()
	
	// Закрываем модальное окно
	messageModal.style.display = 'none'
})

saveServerListBtn.addEventListener('click', () => {
	// Парсим и сохраняем список серверов
	broadcastData.serverList = serverList.value
		.split('\n')
		.map(s => s.trim())
		.filter(s => s && s.includes(':'))
	
	// Устанавливаем текст на кнопке, чтобы было видно, сколько серверов добавлено
	const serverCount = broadcastData.serverList.length
	openServerListBtn.innerHTML = `
		<span class="btn-icon">📋</span>
		<span class="btn-label">Серверы (${serverCount})</span>
	`
	
	// Сохраняем данные
	saveBroadcastData()
	
	// Закрываем модальное окно
	serverListModal.style.display = 'none'
})

// Закрытие модальных окон по клику на крестик
closeButtons.forEach(button => {
	button.addEventListener('click', () => {
		messageModal.style.display = 'none'
		serverListModal.style.display = 'none'
	})
})

// Закрытие модальных окон по клику вне области окна
window.addEventListener('click', (event) => {
	if (event.target === messageModal) {
		messageModal.style.display = 'none'
	}
	if (event.target === serverListModal) {
		serverListModal.style.display = 'none'
	}
})

// Сохраняем состояние переключателя
broadcastCycleToggle.addEventListener('change', () => {
	broadcastData.cycleMode = broadcastCycleToggle.checked
	saveBroadcastData()
})

/**
 * Режим рассылки сообщений по списку серверов
 */
async function runBroadcastMode() {
	// Используем данные из хранилища
	const servers = broadcastData.serverList
	
	// Проверяем, что есть список серверов
	if (servers.length === 0) {
		console.error('Список серверов пуст или некорректен')
		alert('Необходимо указать список серверов!')
		return
	}
	
	// Получаем текст сообщения
	const message = broadcastData.message.trim()
	if (!message) {
		console.error('Текст сообщения не может быть пустым')
		alert('Необходимо ввести сообщение для рассылки!')
		return
	}
	
	// Получаем задержку между серверами
	const delay = parseInt(broadcastDelay.value)
	
	// Режим циклического повторения
	const cycleMode = broadcastData.cycleMode
	
	console.log(`Начинаем рассылку на ${servers.length} серверов${cycleMode ? ' (циклический режим)' : ''}`)
	
	// Счетчик успешных рассылок
	let successCount = 0
	let cycle = 1
	
	// Запускаем цикл рассылки
	while (isRunning) {
		// Пробегаем по каждому серверу последовательно
		for (let i = 0; i < servers.length; i++) {
			if (!isRunning) break
			
			const serverAddress = servers[i]
			const [ip, port] = parseServer(serverAddress)
			
			if (!ip || !port) {
				console.error(`Некорректный адрес сервера: ${serverAddress}`)
				continue
			}
			
			// Обновляем статус с прогрессом
			const cycleInfo = cycleMode ? ` (цикл ${cycle})` : ''
			statusText.textContent = `РАССЫЛКА [${i + 1}/${servers.length}]${cycleInfo}`
			console.log(`[${i + 1}/${servers.length}]${cycleInfo} Подключаемся к серверу: ${serverAddress}`)
			
			// Используем отдельную функцию для рассылки на один сервер
			const success = await broadcastToServer(ip, port, message)
			if (success) {
				successCount++
			}
			
			// Задержка между серверами
			if ((i < servers.length - 1 || cycleMode) && isRunning) {
				await new Promise(r => setTimeout(r, delay))
			}
		}
		
		// Если не циклический режим, выходим после одного прохода
		if (!cycleMode || !isRunning) {
			break
		}
		
		// Увеличиваем счетчик циклов
		cycle++
		
		// Добавляем небольшую задержку между циклами
		if (isRunning) {
			await new Promise(r => setTimeout(r, delay * 2))
		}
	}
	
	// Обновляем статус с результатами
	const cycleInfo = cycleMode && cycle > 1 ? ` (циклов: ${cycle - 1})` : ''
	statusText.textContent = `ЗАВЕРШЕНО: ${successCount}/${servers.length * (cycle - (cycleMode ? 0 : 1))}${cycleInfo}`
	console.log(`Рассылка завершена. Успешно: ${successCount}/${servers.length * (cycle - (cycleMode ? 0 : 1))}${cycleInfo}`)
}

/**
 * Рассылка сообщения на один сервер
 */
async function broadcastToServer(ip, port, message) {
	try {
		// Создаем бота
		const bot = await createBot(ip, port, botNickname.value)
		
		// Устанавливаем обработчик подключения
		let success = false
		let isComplete = false
		
		// Обработчик для подключения и отправки сообщения
		bot.once('connected', async () => {
			try {
				// Ждем немного после подключения
				await new Promise(r => setTimeout(r, 250))
				
				// Вызываем sendInput и отправляем сообщение
				bot.sendInput()
				await bot.sendMessage(message)
				
				// Отмечаем успех
				success = true
				
				// Ждем небольшое время для доставки сообщения
				await new Promise(r => setTimeout(r, 300))
			} catch (err) {
				console.error(`Ошибка при отправке сообщения на ${ip}:${port}: ${err.message}`)
			} finally {
				// Отключаем бота
				try { await bot.Disconnect() } catch (e) {}
				isComplete = true
			}
		})
		
		// Подключаем бота
		bot.connect()
		
		// Ждем завершения или таймаут
		const timeout = 5000 // 5 секунд максимум на одну рассылку
		
		// Создаем таймер для таймаута
		const timeoutPromise = new Promise(resolve => {
			setTimeout(() => {
				if (!isComplete) {
					console.log(`Таймаут для сервера ${ip}:${port}`)
					try { bot.Disconnect() } catch (e) {}
					isComplete = true
					resolve(false)
				}
			}, timeout)
		})
		
		// Ждем завершения отправки сообщения или таймаут
		const completionPromise = new Promise(resolve => {
			const checkInterval = setInterval(() => {
				if (isComplete) {
					clearInterval(checkInterval)
					resolve(success)
				}
			}, 100)
		})
		
		// Возвращаем первый результат из двух промисов
		return Promise.race([completionPromise, timeoutPromise])
	} catch (error) {
		console.error(`Ошибка при рассылке на ${ip}:${port}: ${error.message}`)
		return false
	}
}

// Назначение обработчиков событий
startBtn.addEventListener('click', startBotCycle)
stopBtn.addEventListener('click', stopBotCycle)

// Инициализация при загрузке
updateStatus()
updateModeSettings()
updateCharCount() // Инициализация счетчика символов

// Загружаем сохраненные данные рассылки
loadBroadcastData()

// Устанавливаем начальные значения для кнопок и переключателей
if (broadcastData.message) {
	const messageLength = broadcastData.message.length
	openMessageBtn.innerHTML = `
		<span class="btn-icon">✉</span>
		<span class="btn-label">Сообщение (${messageLength})</span>
	`
}

if (broadcastData.serverList.length > 0) {
	const serverCount = broadcastData.serverList.length
	openServerListBtn.innerHTML = `
		<span class="btn-icon">📋</span>
		<span class="btn-label">Серверы (${serverCount})</span>
	`
}

// Устанавливаем состояние переключателя циклического режима
broadcastCycleToggle.checked = broadcastData.cycleMode

// Обработка закрытия окна
window.addEventListener('beforeunload', () => {
	if (isRunning) {
		stopBotCycle()
	}
})
