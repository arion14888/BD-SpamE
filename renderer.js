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

// Получаем элемент турбо-режима
const turboToggle = document.getElementById('turboToggle')

// Показ/скрытие настроек в зависимости от режима
function updateModeSettings() {
	const messageSettings = document.getElementById('messageSettings')
	const broadcastSettings = document.getElementById('broadcastSettings')
	const settingsSection = document.querySelector('.settings-section')
	const bodyElement = document.body
	const turboModeToggle = document.getElementById('turboModeToggle')
	
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

	// Показываем переключатель турбо-режима только в режиме спама
	if (modes.spam.checked) {
		turboModeToggle.style.display = 'block'
	} else {
		turboModeToggle.style.display = 'none'
	}
}

/**
 * Основная функция цикла создания ботов
 */
async function startBotCycle() {
	if (isRunning) return

	// Обновляем интерфейс и запускаем выбранный режим
	isRunning = true
	updateStatus()

	// Запускаем асинхронное обновление UI
	updateUIAsync()

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
		} else if (modes.spam.checked) {
			const [ip, port] = parseServer(serverAddress.value)
			if (!ip || !port) {
				throw new Error('Неверный адрес сервера')
			}
			
			// Проверяем включен ли турбо-режим
			if (turboToggle.checked) {
				// Запускаем режим заход/выход
				await cycleJoinLeaveMode(ip, port)
			} else {
				// Запускаем обычный спам режим
				await runSpamMode(ip, port)
			}
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
	// Проверяем, что мы действительно в рабочем состоянии
	isRunning = true;
	startBtn.disabled = true;
	stopBtn.disabled = false;
	
		const bots = []
	const maxBots = parseInt(botCount.value)
	let connectedCount = 0
	
	console.log(`Запуск режима болванки: ${maxBots} ботов на сервер ${ip}:${port}`)
	
	// Настраиваем голосование, если сообщение начинается с /vote
	const isVoteMode = botMessage.value.trim().startsWith('/vote ')
	const voteOption = isVoteMode ? botMessage.value.slice(6).trim() : ''
	
	// Оптимизированное создание ботов
	try {
		// Создаем ботов с оптимальными задержками
		for (let i = 1; i <= maxBots && isRunning; i++) {
			try {
				// Проверяем флаг остановки перед созданием каждого бота
				if (!isRunning) break;
				
				const bot = await createBot(ip, port, botNickname.value)
				
				// Обязательно добавляем обработчик подключения для всех ботов
				bot.once('connected', () => {
					// Проверяем флаг остановки после подключения
					if (!isRunning) {
						try { bot.Disconnect(); } catch (e) {}
						return;
					}
					
					connectedCount++
					
					// Обязательно вызываем sendInput для регистрации бота
					bot.sendInput()
					
					// Обновляем статус при подключении
					statusText.textContent = `РЕЖИМ БОЛВАНКИ: Подключено ${connectedCount}/${maxBots}`
					console.log(`Бот #${connectedCount} подключен`)
					
					// Для режима голосования устанавливаем голосование с задержкой
					if (isVoteMode) {
						setTimeout(async () => {
							// Проверяем флаг остановки перед голосованием
							if (!isRunning) {
								try { bot.Disconnect(); } catch (e) {}
								return;
							}
							
							try {
								// Используем оптимизированный метод голосования
								await bot.vote(voteOption)
								console.log(`Бот #${connectedCount} проголосовал за "${voteOption}"`)
							} catch (err) {
								console.error(`Ошибка при голосовании: ${err.message}`)
							}
						}, 300 + (i % 5) * 50) // Увеличенные и разнесенные задержки
					}
				})
				
				// Устанавливаем таймаут на случай ошибки подключения
				setTimeout(() => {
					try {
						if (bot && (!bot.isConnected || !bot.isConnected())) {
							bot.Disconnect()
						}
					} catch (e) {}
				}, 5000) // Увеличенный таймаут для проблемных серверов
				
				// Подключаем бота и добавляем в массив
				bot.connect()
				bots.push(bot)
				
				// Обновляем текущий статус создания
				statusText.textContent = `РЕЖИМ БОЛВАНКИ: Создано ${i}/${maxBots}, подключено ${connectedCount}`
				
				// Задержка между созданием ботов - увеличиваем для проблемных серверов
				await new Promise(r => setTimeout(r, 50)) // Повышенная задержка 50мс
				
				// Проверяем флаг остановки после создания каждого бота
				if (!isRunning) {
					console.log(`Остановка режима болванки после создания ${i} ботов`);
					break;
				}
			} catch (error) {
				console.error('Ошибка при создании бота:', error)
			}
		}

		console.log(`Создание ботов завершено: ${bots.length} создано, ${connectedCount} подключено`)
		
		// Поддерживаем ботов подключенными с частой проверкой флага остановки
		while (isRunning) {
			statusText.textContent = `РЕЖИМ БОЛВАНКИ: Подключено ${connectedCount}/${maxBots}`
			
			// Используем более короткую задержку для быстрой реакции на остановку
			await new Promise(r => setTimeout(r, 100))
			
			// Обработка периодических задач по мере необходимости
			// ...
		}
	} catch (error) {
		console.error(`Ошибка в режиме болванки: ${error.message}`)
	} finally {
		// Отключаем ботов при завершении режима
		console.log(`Отключение ботов...`)
		statusText.textContent = `РЕЖИМ БОЛВАНКИ: Отключение...`
		
		// Отключаем ботов группами для стабильности
		try {
			const disconnectBatchSize = 10
			for (let i = 0; i < bots.length; i += disconnectBatchSize) {
				const batch = bots.slice(i, Math.min(i + disconnectBatchSize, bots.length))
				await disconnectBots(batch)
				await new Promise(r => setTimeout(r, 10))
				
				// Обновляем статус отключения
				const disconnectedCount = Math.min((i + disconnectBatchSize), bots.length);
				statusText.textContent = `РЕЖИМ БОЛВАНКИ: Отключение (${disconnectedCount}/${bots.length})...`
			}
			
			// Гарантированное отключение всех ботов
					await disconnectAllBots()
		} catch (e) {
			console.error("Ошибка при отключении ботов:", e);
			// Финальная попытка отключения
			await disconnectAllBots();
		}
		
		// Обновляем финальный статус
		statusText.textContent = `РЕЖИМ БОЛВАНКИ: Остановлен`;
		startBtn.disabled = false;
		stopBtn.disabled = true;
		
		console.log(`Все боты отключены`)
	}
}

/**
 * Режим экстремального спама - нулевые задержки, максимальная скорость
 */
async function runSpamMode(ip, port) {
	isRunning = true;
	startBtn.disabled = true;
	stopBtn.disabled = false;
	
	// Основной цикл спама - работает до нажатия на стоп
	while (isRunning) {
		// Максимальное количество ботов в одном цикле
		const maxBots = parseInt(botCount.value);
		let connectedCount = 0;
		const startTime = Date.now();
		
		// Запускаем волну ботов
		statusText.textContent = `СПАМ: Запуск...`;
		
		// Количество одновременно запускаемых ботов
		const batchSize = 300; // Большее количество для максимальной скорости
		
		for (let i = 0; i < maxBots && isRunning; i += batchSize) {
			const currentBatchSize = Math.min(batchSize, maxBots - i);
			
			// Запускаем пакет ботов одновременно
			const promises = [];
			
			for (let j = 0; j < currentBatchSize; j++) {
				promises.push((async () => {
					try {
						const bot = await createBot(ip, port, botNickname.value || '');
						
						// Настраиваем обработчик подключения
						bot.once('connected', () => {
							connectedCount++;
							
							// Отправляем input и мгновенно отключаемся
							try {
								bot.sendInput();
								setTimeout(() => {
									try {
										bot.Disconnect();
									} catch (e) {}
								}, 100);
							} catch (e) {}
							
							// Обновляем статус с низкой частотой для производительности
							if (connectedCount % 100 === 0) {
								const elapsedSec = (Date.now() - startTime) / 1000;
								const ratePerSec = Math.floor(connectedCount / Math.max(0.1, elapsedSec));
								statusText.textContent = `СПАМ: ${connectedCount} (${ratePerSec}/сек)`;
							}
						});
						
						// Подключаем бота
						bot.connect();
					} catch (error) {
						console.error('Ошибка при создании бота:', error);
					}
				})());
			}
			
			// Ждем завершения пакета
			try {
				// Увеличиваем таймаут для более стабильной работы
				await Promise.race([
					Promise.all(promises),
					new Promise(r => setTimeout(r, 100))
				]);
			} catch (e) {
				console.error('Ошибка при ожидании пакета:', e);
			}
			
			// Проверяем флаг остановки
			if (!isRunning) break;
		}
		
		// Увеличиваем время ожидания завершения подключений
		await new Promise(r => setTimeout(r, 500));
		
		// Отключаем все соединения
		await disconnectAllBots();
		
		// Обновляем статус в конце цикла
		const cycleTime = (Date.now() - startTime) / 1000;
		const ratePerSec = Math.floor(connectedCount / Math.max(0.1, cycleTime));
		statusText.textContent = `СПАМ: ${connectedCount} за ${cycleTime.toFixed(1)}с (${ratePerSec}/сек)`;
		
		// Проверяем флаг остановки
		if (!isRunning) break;
		
		// Задержка между циклами
		if (parseInt(cycleDelay.value) > 0) {
			await new Promise(r => setTimeout(r, parseInt(cycleDelay.value)));
		} else {
			// Минимальная задержка для проверки флага остановки
			await new Promise(r => setTimeout(r, 10));
		}
	}
	
	// Обновляем UI в конце
	statusText.textContent = `СПАМ остановлен`;
	startBtn.disabled = false;
	stopBtn.disabled = true;
}

/**
 * Режим сверхбыстрой отправки сообщений с минимальными задержками
 */
async function runMessageMode(ip, port) {
	isRunning = true;
	startBtn.disabled = true;
	stopBtn.disabled = false;
	
		while (isRunning) {
		const maxBots = parseInt(botCount.value);
		const message = botMessage.value.trim();
		let connectedCount = 0;
		let messagesSent = 0;
		let activeBots = 0;
		const startTime = Date.now();
		const delayValue = parseInt(botDelay.value);
		
		// Специальный режим без задержки вообще
		const isZeroDelay = delayValue === 0;
		
		statusText.textContent = `СООБЩЕНИЯ: Запуск...`;
		
		try {
			// Увеличиваем размер группы ботов для ускорения
			const batchSize = isZeroDelay ? 20 : 10; // Большие группы для скорости
			
			for (let i = 0; i < maxBots && isRunning; i += batchSize) {
				const currentBatchSize = Math.min(batchSize, maxBots - i);
				
				// Запускаем группу ботов параллельно
				const promises = [];
				
				for (let j = 0; j < currentBatchSize && isRunning; j++) {
					promises.push((async () => {
						try {
							activeBots++;
							const bot = await createBot(ip, port, botNickname.value);
							
							// Устанавливаем обработчик подключения
							bot.once('connected', () => {
								if (!isRunning) {
									try { bot.Disconnect(); } catch (e) {}
									activeBots--;
									return;
								}
								
								connectedCount++;
								
								// Минимальная задержка перед отправкой (почти мгновенно)
								setTimeout(async () => {
									if (!isRunning) {
										try { bot.Disconnect(); } catch (e) {}
										activeBots--;
										return;
				}

				try {
										// Вызываем sendInput для активации чата
										bot.sendInput();
										
										// Отправляем сообщение
										try {
											await bot.game.Say(message);
											messagesSent++;
											
											// Обновляем статус реже
											if (messagesSent % 20 === 0) {
												const elapsedSec = (Date.now() - startTime) / 1000;
												const ratePerSec = Math.floor(messagesSent / Math.max(0.1, elapsedSec));
												statusText.textContent = `СООБЩЕНИЯ: ${messagesSent}/${connectedCount} (${ratePerSec}/сек)`;
											}
											
											// Если задержка 0, отключаем сразу после отправки
											if (isZeroDelay) {
												bot.Disconnect();
												activeBots--;
												return;
											}
										} catch (err) {
											try {
												const result = await bot.sendMessage(message);
												if (result) {
													messagesSent++;
													
													// Если задержка 0, отключаем сразу после отправки
													if (isZeroDelay) {
														bot.Disconnect();
														activeBots--;
														return;
													}
												}
											} catch (e) {
												// Если не удалось отправить сообщение и задержка 0, отключаем сразу
												if (isZeroDelay) {
													bot.Disconnect();
													activeBots--;
													return;
												}
											}
										}
										
										// Только если задержка не 0, оставляем бота на сервере
										if (!isZeroDelay) {
											setTimeout(() => {
												try {
													if (isRunning && Math.random() > 0.5) {
														try {
															bot.game.Say(message);
															messagesSent++;
														} catch (e) {}
													}
													bot.Disconnect();
													activeBots--;
												} catch (e) {
													activeBots--;
												}
											}, delayValue);
										}
									} catch (e) {
										activeBots--;
									}
								}, isZeroDelay ? 5 : 50); // При нулевой задержке ждем всего 5 мс
								
								// Таймаут для зависших ботов - уменьшаем при нулевой задержке
								setTimeout(() => {
									try {
										if (bot.isConnected && bot.isConnected()) {
											bot.Disconnect();
										}
										activeBots--;
									} catch (e) {}
								}, isZeroDelay ? 1000 : (delayValue + 2000));
							});
							
							// Обработка ошибки подключения
							bot.once('disconnect', () => {
								activeBots--;
							});
							
							// Подключаем бота
							bot.connect();
					} catch (error) {
							activeBots--;
						}
					})());
				}
				
				// Минимальная задержка для контроля потока
				if (isZeroDelay) {
					// При нулевой задержке даем минимальную паузу для JavaScript event loop
					await new Promise(r => setTimeout(r, 1)); 
				} else {
					// Иначе используем короткий таймаут
					await Promise.race([
						Promise.all(promises),
						new Promise(r => setTimeout(r, 10))
					]);
					
					// Между пакетами боты перекрываются для постоянного присутствия
					await new Promise(r => setTimeout(r, 10));
				}
				
				// Проверка остановки процесса
				if (!isRunning) break;
			}
			
			// При нулевой задержке сокращаем время ожидания
			const waitTime = isZeroDelay ? 1000 : Math.min(delayValue + 3000, 10000);
			
			// Ждем завершения всех ботов или таймаут
			let waitStartTime = Date.now();
			
			while (activeBots > 0 && isRunning && (Date.now() - waitStartTime) < waitTime) {
				// Обновляем статус реже
				if ((Date.now() - waitStartTime) % 2000 < 100) {
					const elapsedSec = (Date.now() - startTime) / 1000;
					const ratePerSec = Math.floor(messagesSent / Math.max(0.1, elapsedSec));
					statusText.textContent = `СООБЩЕНИЯ: ${messagesSent}/${connectedCount} (${ratePerSec}/сек)`;
				}
				
				// Уменьшаем интервал проверки при нулевой задержке
				await new Promise(r => setTimeout(r, isZeroDelay ? 50 : 100));
			}
			
			// Отключаем всех оставшихся ботов
			await disconnectAllBots();
			
			// Если была нажата остановка, выходим из цикла
			if (!isRunning) {
				statusText.textContent = `СООБЩЕНИЯ: Остановлено`;
				break;
			}
			
			// Обновляем статус с информацией о времени
			const elapsedTime = (Date.now() - startTime) / 1000;
			const ratePerSec = Math.floor(messagesSent / Math.max(0.1, elapsedTime));
			statusText.textContent = `СООБЩЕНИЯ: ${messagesSent} за ${elapsedTime.toFixed(1)}с (${ratePerSec}/сек)`;
			
			// При нулевой задержке почти не ждем между циклами
			const cycleDelayValue = parseInt(cycleDelay.value);
			if (isRunning) {
				if (cycleDelayValue > 0) {
					// При большой задержке проверяем флаг остановки чаще
					if (cycleDelayValue > 500) {
						for (let i = 0; i < cycleDelayValue && isRunning; i += 100) {
							await new Promise(r => setTimeout(r, Math.min(100, cycleDelayValue - i)));
							if (!isRunning) break;
						}
					} else {
						await new Promise(r => setTimeout(r, cycleDelayValue));
					}
				} else {
					// При нулевой задержке между циклами ждем минимально
					await new Promise(r => setTimeout(r, 1));
				}
			}
		} catch (error) {
			console.error("Ошибка в режиме сообщений:", error);
			await disconnectAllBots();
		}
		
		// Если была нажата остановка, выходим из цикла
		if (!isRunning) break;
	}
	
	// Гарантированная очистка в конце
	await disconnectAllBots();
	
	// Обновляем UI в конце
	statusText.textContent = `СООБЩЕНИЯ: Завершено`;
	startBtn.disabled = false;
	stopBtn.disabled = true;
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
 * Останавливает работу всех ботов и циклов
 */
function stopBotCycle() {
	// МГНОВЕННАЯ ОСТАНОВКА
	console.log("СТОП НАЖАТ - ПОЛНАЯ ОСТАНОВКА ВСЕХ БОТОВ");
	
	// Гарантированно меняем флаг
	isRunning = false;
	
	// Обновляем UI и делаем кнопку стоп неактивной сразу
	statusText.textContent = "ОСТАНОВКА ВЫПОЛНЕНА";
	startBtn.disabled = false;
	stopBtn.disabled = true;
	
	// Делаем несколько принудительных отключений всех ботов
	try {
		disconnectAllBots();
		// Повторно через IPC
		ipcRenderer.send('disconnect-all-bots');
		
		// Принудительно запускаем сборщик мусора для освобождения памяти
		ipcRenderer.send('force-gc');
	} catch (e) {
		console.error("Ошибка при остановке:", e);
	}
}

/**
 * Обновление состояния интерфейса
 */
function updateStatus() {
	// Обновляем текст статуса только если не находимся в режиме рассылки
	// или если процесс остановлен
	if (!isRunning || !modes.broadcast.checked) {
	statusText.textContent = isRunning ? 'ЗАПУЩЕНО' : 'ОСТАНОВЛЕНО'
	}
	
	// Обновляем класс состояния
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

openMessageBtn.addEventListener('click', () => {
	broadcastMessage.value = broadcastData.message
	updateCharCount()
	
	messageModal.style.display = 'block'
})

openServerListBtn.addEventListener('click', () => {
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
 * Рассылка сообщения на один сервер
 */
async function broadcastToServer(server, message) {
	if (!isRunning) return false;
	
	const [ip, port] = parseServer(server);
	if (!ip || !port) {
		console.error('Неверный адрес сервера:', server);
		return false;
	}

	try {
		// Создаем бота
		const bot = await createBot(ip, port, botNickname.value);
		if (!isRunning) {
			bot.Disconnect();
			return false;
		}

		// Подключаемся к серверу
		bot.connect();
		
		// Ждем подключения с таймаутом
		const connected = await new Promise((resolve) => {
			const timeout = setTimeout(() => {
				bot.Disconnect();
				resolve(false);
			}, 5000);

			bot.once('connected', () => {
				clearTimeout(timeout);
				resolve(true);
			});

			bot.once('disconnected', () => {
				clearTimeout(timeout);
				resolve(false);
			});
		});
		
		if (!connected || !isRunning) {
			bot.Disconnect();
			return false;
		}

		// Регистрируем бота для активации чата
		bot.sendInput();
		
		// Задержка перед отправкой сообщения
		await new Promise(r => setTimeout(r, 500));
		
		if (!isRunning) {
			bot.Disconnect();
			return false;
		}

		// Отправляем сообщение
		let messageSent = false;
		try {
			if (bot.game && bot.game.Say) {
				await bot.game.Say(message);
				messageSent = true;
				console.log(`Сообщение отправлено на ${server} через game.Say`);
			} else if (bot.sendMessage) {
				const result = await bot.sendMessage(message);
				messageSent = !!result;
				console.log(`Сообщение отправлено на ${server} через sendMessage`);
			} else if (bot.sendChat) {
				bot.sendChat(message);
				messageSent = true;
				console.log(`Сообщение отправлено на ${server} через sendChat`);
			}
			
			// Задержка после отправки сообщения
			await new Promise(r => setTimeout(r, 300));
		} catch (e) {
			console.error('Ошибка отправки сообщения:', e);
			messageSent = false;
		}

		// Отключаемся
		bot.Disconnect();
		
		// Обновляем статус
		if (isRunning) {
			const currentServer = serverList.value;
			const servers = currentServer.split('\n').filter(s => s.trim());
			const currentIndex = servers.indexOf(server);
			
			if (currentIndex >= 0) {
				statusText.textContent = `РАССЫЛКА: ${currentIndex + 1}/${servers.length} серверов`;
			}
		}
		
		return messageSent;
	} catch (error) {
		console.error('Ошибка при рассылке на сервер:', server, error);
		if (isRunning) {
			statusText.textContent = `РАССЫЛКА: Ошибка на сервере ${server}`;
		}
		return false;
	}
}

/**
 * Режим рассылки по серверам
 */
async function runBroadcastMode() {
	isRunning = true;
	startBtn.disabled = true;
	stopBtn.disabled = false;

	// Получаем настройки рассылки
	const message = broadcastMessage.value || broadcastData.message;
	const delay = parseInt(broadcastDelay.value) || 0;
	const isCycleMode = broadcastCycleToggle.checked;
	
	// Обрабатываем список серверов, удаляя пустые строки
	let servers;
	
	// Если есть серверы в поле ввода, используем их
	if (serverList.value && serverList.value.trim()) {
		servers = serverList.value.split('\n').filter(s => s.trim());
	} 
	// Иначе используем серверы из хранилища
	else if (broadcastData.serverList && broadcastData.serverList.length > 0) {
		servers = broadcastData.serverList;
		// Также заполняем поле ввода для наглядности
		serverList.value = broadcastData.serverList.join('\n');
	} 
	// Если серверов нет нигде
	else {
		alert('Добавьте хотя бы один сервер для рассылки');
		isRunning = false;
		updateStatus();
		return;
	}
	
	// Сохраняем серверы в хранилище для следующего использования
	broadcastData.serverList = servers;
	saveBroadcastData();
	
	// Проверяем наличие сообщения
	if (!message) {
		alert('Введите сообщение для рассылки');
		isRunning = false;
		updateStatus();
		return;
	}
	
	// Сохраняем сообщение в хранилище
	broadcastData.message = message;
	broadcastMessage.value = message;
	saveBroadcastData();
	
	console.log(`Запуск рассылки на ${servers.length} серверов. Циклический режим: ${isCycleMode}`);
	
	// Счетчики для статистики
	let successCount = 0;
	let cycleCount = 0;
	let currentIndex = 0;
	
	// Основной цикл рассылки
	try {
		// Создаем копию списка серверов для обработки
		let cycle = 1;
		
		// Продолжаем цикл, пока флаг isRunning = true
		while (isRunning) {
			// Обновляем номер цикла для цикличного режима
			if (isCycleMode && currentIndex === 0) {
				cycleCount = cycle;
				statusText.textContent = `РАССЫЛКА [${currentIndex}/${servers.length}] (цикл ${cycle})`;
			} else {
				statusText.textContent = `РАССЫЛКА: ${currentIndex}/${servers.length} серверов`;
			}
			
			// Проверяем флаг остановки перед каждым сервером
			if (!isRunning) break;
			
			// Получаем текущий сервер
			const server = servers[currentIndex];
			
			// Пропускаем пустые серверы
			if (!server || !server.trim()) {
				currentIndex = (currentIndex + 1) % servers.length;
				continue;
			}
			
			// Парсим сервер
			const [ip, port] = parseServer(server);
			if (!ip || !port) {
				console.error(`Неверный формат сервера: ${server}`);
				currentIndex = (currentIndex + 1) % servers.length;
				continue;
			}
			
			// Обновляем статус с информацией о текущем сервере
			if (isCycleMode) {
				statusText.textContent = `РАССЫЛКА [${currentIndex+1}/${servers.length}] (цикл ${cycle})`;
			} else {
				statusText.textContent = `РАССЫЛКА: ${currentIndex+1}/${servers.length} серверов`;
			}
			
			// Проверяем флаг остановки перед отправкой
			if (!isRunning) break;
			
			// Отправляем сообщение на текущий сервер
			const success = await broadcastToServer(server, message);
			if (success) successCount++;
			
			// Проверяем флаг остановки после отправки
			if (!isRunning) break;
			
			// Задержка между серверами
			if (delay > 0 && isRunning) {
				// Ожидание с регулярной проверкой флага остановки
				const startWait = Date.now();
				while (isRunning && (Date.now() - startWait < delay)) {
					// Проверяем флаг каждые 100мс
					await new Promise(r => setTimeout(r, Math.min(100, delay)));
					
					// Обновляем статус с обратным отсчетом
					if (isCycleMode) {
						const remainingTime = Math.max(0, delay - (Date.now() - startWait));
						const seconds = Math.ceil(remainingTime / 1000);
						statusText.textContent = `РАССЫЛКА [${currentIndex+1}/${servers.length}] (цикл ${cycle}) - следующий через ${seconds}с`;
					}
				}
				
				// Прерываем, если кнопка стоп была нажата во время ожидания
				if (!isRunning) break;
			}
			
			// Переходим к следующему серверу
			currentIndex = (currentIndex + 1) % servers.length;
			
			// Если завершили цикл и режим не цикличный - выходим
			if (currentIndex === 0) {
				if (!isCycleMode) {
					break;
				}
				// Увеличиваем счетчик циклов
				cycle++;
			}
		}
		
		console.log(`Рассылка завершена: ${successCount} успешных отправок`);
	} catch (error) {
		console.error('Ошибка в режиме рассылки:', error);
	} finally {
		// Принудительно отключаем всех ботов
		await disconnectAllBots();
		
		// Обновляем UI
		isRunning = false;
		statusText.textContent = `РАССЫЛКА: Остановлена`;
		startBtn.disabled = false;
		stopBtn.disabled = true;
	}
}

// Назначение обработчиков событий - удаляем дублирующий код
// Оставляем только один набор обработчиков событий
startBtn.addEventListener('click', startBotCycle)
stopBtn.addEventListener('click', async () => {
	// Устанавливаем флаг остановки
	console.log('Остановка процесса...');
	isRunning = false;
	
	// Обновляем статус НЕМЕДЛЕННО
	statusText.textContent = 'ОСТАНОВКА...';
	
	// Отключаем все боты немедленно
	try {
		disconnectAllBots();
	} catch (e) {
		console.error('Ошибка при отключении ботов:', e);
	}
	
	// Отправляем сигнал сборки мусора
	if (window.gc) {
		try {
			window.gc();
		} catch (e) {}
	}
	
	// Сбрасываем состояние UI
	startBtn.disabled = false;
	stopBtn.disabled = true;
	updateStatus();
})

// Инициализация при загрузке
updateStatus()
updateModeSettings()
updateCharCount() // Инициализация счетчика символов

// Проверка и установка минимальных значений задержек
function setMinimumDelays() {
	// УБИРАЕМ ВСЕ МИНИМАЛЬНЫЕ ОГРАНИЧЕНИЯ
	const MIN_BOT_DELAY = 0;
	const MIN_CYCLE_DELAY = 0;
	const MIN_BROADCAST_DELAY = 0;
	
	// Установка минимумов при загрузке
	if (parseInt(botDelay.value) < MIN_BOT_DELAY) {
		botDelay.value = MIN_BOT_DELAY;
	}
	
	if (parseInt(cycleDelay.value) < MIN_CYCLE_DELAY) {
		cycleDelay.value = MIN_CYCLE_DELAY;
	}
	
	if (parseInt(broadcastDelay.value) < MIN_BROADCAST_DELAY) {
		broadcastDelay.value = MIN_BROADCAST_DELAY;
	}
	
	// Убираем ограничения для проверки при вводе
	botDelay.addEventListener('change', () => {
		if (parseInt(botDelay.value) < 0) {
			botDelay.value = 0;
		}
	});
	
	cycleDelay.addEventListener('change', () => {
		if (parseInt(cycleDelay.value) < 0) {
			cycleDelay.value = 0;
		}
	});
	
	broadcastDelay.addEventListener('change', () => {
		if (parseInt(broadcastDelay.value) < 0) {
			broadcastDelay.value = 0;
		}
	});
}

// Вызываем функцию инициализации минимальных задержек
setMinimumDelays();

// Функция для обновления интерфейса без блокировки UI-потока
function updateUIAsync() {
	if (!isRunning) return;
	
	// Используем requestAnimationFrame для синхронизации с отрисовкой UI
	requestAnimationFrame(() => {
		// Обновляем только класс состояния, а не текст
		const statusDisplay = document.querySelector('.status-display')
		statusDisplay.dataset.status = isRunning ? 'running' : 'stopped'
		
		// Планируем следующее обновление
		setTimeout(updateUIAsync, 100);
	});
}

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

/**
 * Режим захода и выхода ботов (на основе primera)
 */
async function cycleJoinLeaveMode(ip, port) {
	isRunning = true;
	startBtn.disabled = true;
	stopBtn.disabled = false;
	
	const maxBots = parseInt(botCount.value);
	const delayValue = parseInt(botDelay.value);
	const cycleDelayValue = parseInt(cycleDelay.value);
	let totalJoins = 0;
	let cycleCount = 0;
	
	console.log(`Запуск режима захода/выхода: ${maxBots} ботов на сервер ${ip}:${port}`);
	statusText.textContent = `ТУРБО-РЕЖИМ: Запуск...`;
	
	try {
		while (isRunning) {
			cycleCount++;
			let connectedCount = 0;
			const cycleStartTime = Date.now();
			
			statusText.textContent = `ТУРБО-РЕЖИМ: Цикл ${cycleCount}, подключений: ${totalJoins}`;
			
			// Создаем список ботов параллельно
			const botPromises = [];
			
			for (let i = 0; i < maxBots && isRunning; i++) {
				const botPromise = (async () => {
					try {
						// Создаем бота
						const bot = await createBot(ip, port, botNickname.value);
						
						// Используем Promise для отслеживания подключения
						let connected = false;
						
						bot.once('connected', () => {
							if (!isRunning) return;
							
							connected = true;
							connectedCount++;
							totalJoins++;
							
							// Регистрируем бота
							bot.sendInput();
							
							// Если есть сообщение для отправки
							if (botMessage.value && botMessage.value.trim() !== '') {
								try {
									// Отправляем сообщение немедленно
									if (bot.game && bot.game.Say) {
										bot.game.Say(botMessage.value.trim());
									} else if (bot.sendMessage) {
										bot.sendMessage(botMessage.value.trim());
									} else if (bot.sendChat) {
										bot.sendChat(botMessage.value.trim());
									}
								} catch (e) {}
							}
							
							// Обновляем статус
							if (i % 10 === 0 || i === maxBots - 1) {
								statusText.textContent = `ТУРБО-РЕЖИМ: Цикл ${cycleCount}, подключено: ${connectedCount}/${maxBots}`;
							}
						});
						
						// Подключаем бота
						bot.connect();
						
						// Мгновенное отключение для максимальной скорости
						await new Promise(resolve => setTimeout(resolve, Math.min(50, delayValue)));
						
						// Отключаем бота сразу после минимальной задержки
						try {
							bot.Disconnect();
						} catch (error) {}
					} catch (error) {}
				})();
				
				botPromises.push(botPromise);
				
				// Минимальная задержка между созданием ботов
				if (isRunning) {
					await new Promise(r => setTimeout(r, Math.min(10, delayValue / 10)));
				}
			}
			
			// Ждем завершения всех ботов
			await Promise.all(botPromises);
			
			// Отключаем всех оставшихся ботов
			await disconnectAllBots();
			
			// Если все еще работаем, показываем результаты
			if (isRunning) {
				const cycleTime = (Date.now() - cycleStartTime) / 1000;
				statusText.textContent = `ТУРБО-РЕЖИМ: Цикл ${cycleCount} завершен. ${connectedCount} за ${cycleTime.toFixed(1)}сек`;
				
				// Минимальная задержка между циклами
				if (cycleDelayValue > 0) {
					await new Promise(resolve => setTimeout(resolve, cycleDelayValue));
				} else {
					await new Promise(r => setTimeout(r, 1)); // Почти без задержки
				}
			}
			
			if (!isRunning) break;
		}
	} catch (error) {
		console.error(`Ошибка в турбо-режиме: ${error.message}`);
	} finally {
		await disconnectAllBots();
		statusText.textContent = `ТУРБО-РЕЖИМ: Завершено (${totalJoins} подключений)`;
		startBtn.disabled = false;
		stopBtn.disabled = true;
	}
}

function showTurboTooltip(event) {
	const tooltip = document.createElement('div');
	tooltip.className = 'turbo-tooltip';
	
	// Создаем многострочную табличку вместо простого текста
	tooltip.innerHTML = `
		<div class="tooltip-header">ВНИМАНИЕ!</div>
		<div class="tooltip-content">
			<p>Турбо-режим работает</p>
			<p>не на всех серверах</p>
		</div>
	`;
	
	// Получаем размеры окна и элемента
	const windowWidth = window.innerWidth;
	const windowHeight = window.innerHeight;
	const rect = event.target.getBoundingClientRect();
	
	// Позиционируем подсказку над переключателем
	let left = rect.left;
	let top = rect.top - 60; // Увеличиваем отступ для многострочной подсказки
	
	// Проверяем границы окна
	if (left + 200 > windowWidth) { // 200 - примерная ширина подсказки
		left = windowWidth - 220; // Оставляем отступ от правого края
	}
	
	if (top < 0) {
		top = rect.bottom + 10; // Если не помещается сверху, показываем снизу
	}
	
	tooltip.style.left = `${left}px`;
	tooltip.style.top = `${top}px`;
	
	document.body.appendChild(tooltip);
	
	setTimeout(() => {
		tooltip.remove();
	}, 2000);
}

// Добавляем обработчик события для переключателя турбо-режима
document.getElementById('turboModeToggle').addEventListener('change', function(event) {
	// Показываем подсказку только при включении турбо-режима
	if (event.target.checked) {
		showTurboTooltip(event);
	}
});
