const { Client } = require('teeworlds')

// Обновленная версия DDNet (актуальная на 2023-2024)
const DDNET_VERSION = {
	version: 17,  // Последняя версия протокола DDNet
	release_version: '18.0.2'  // Последний релиз DDNet
}

// Глобальный массив активных ботов
let activeBots = []

/**
 * Создает и возвращает нового бота
 * @param {string} serverIp - IP сервера
 * @param {number} serverPort - Порт сервера
 * @param {string} nickname - Базовый никнейм бота
 * @returns {Promise<Object>} - Объект бота
 */
async function createBot(serverIp, serverPort, nickname) {
	if (!serverIp || !serverPort) {
		throw new Error('Не указан IP или порт сервера')
	}

	// Генерация случайного суффикса для никнейма
	const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
	const botName = nickname && nickname.trim() !== '' 
		? `${nickname}${randomNum}` 
		: randomNum

	// Создаем DDNet клиент с оптимизированными настройками
	const client = new Client(serverIp, serverPort, botName, {
		identity: {
			name: botName,
			clan: '',
			skin: 'default',
			use_custom_color: 0,
			color_body: Math.floor(Math.random() * 0xffffff),
			color_feet: Math.floor(Math.random() * 0xffffff),
			country: -1,
		},
		timeout: 2500,      // Оптимальный таймаут для баланса скорости и надежности
		lightweight: false, // Отключаем легковесный для большей надежности соединения
		ddnet_version: DDNET_VERSION // Указываем актуальную версию DDNet клиента
	})

	// Отслеживание состояния подключения
	let isConnected = false
	let isReady = false
	let connectionTimeout = null

	// Обработчик подключения
	client.on('connected', () => {
		isConnected = true
		
		// Очищаем таймаут, если он был установлен
		if (connectionTimeout) {
			clearTimeout(connectionTimeout)
			connectionTimeout = null
		}
		
		// Инициализация после подключения
		if (client.sendInput) client.sendInput()
		
		// Отмечаем как полностью готовый
		isReady = true
	})

	// Обработчик отключения
	client.on('disconnect', () => {
		isConnected = false
		isReady = false
	})

	// Устанавливаем таймаут на подключение
	connectionTimeout = setTimeout(() => {
		if (!isConnected) {
			try { client.Disconnect() } catch (e) {}
		}
	}, 2500)

	// Добавляем в массив активных ботов
	activeBots.push(client)
	
	// Расширяем API клиента
	client.isConnected = () => isConnected
	client.isReady = () => isReady
	
	// Оптимизированный метод для отправки сообщений
	client.sendMessage = async (message) => {
		if (!isConnected) return false
		
		try {
			if (client.sendInput) client.sendInput()
			await client.game.Say(message)
			return true
		} catch (e) {
			return false
		}
	}
	
	// Добавляем метод sendInput, если его нет
	if (!client.sendInput) {
		client.sendInput = () => {
			try {
				if (client._sendInput) client._sendInput()
				if (client.sendInputPacket) client.sendInputPacket()
			} catch (e) {}
		}
	}
	
	// Добавляем метод для голосования (для режима болванки)
	client.vote = async (option, reason = '') => {
		if (!isConnected) return false
		
		try {
			// Вызываем sendInput перед голосованием
			if (client.sendInput) client.sendInput()
			await client.game.CallVoteOption(option, reason)
			
			// Небольшая задержка перед голосованием "за"
			await new Promise(r => setTimeout(r, 50))
			await client.game.Vote(true)
			return true
		} catch (e) {
			return false
		}
	}
	
	return client
}

/**
 * Отключает всех активных ботов
 */
async function disconnectAllBots() {
	// Создаем копию массива и сразу очищаем оригинал
	const botsToDisconnect = [...activeBots]
	activeBots = []
	
	// Отключаем всех ботов параллельно
	if (botsToDisconnect.length > 0) {
		await Promise.all(
			botsToDisconnect.map(bot => 
				new Promise(resolve => {
					try { bot.Disconnect() } catch (e) {}
					resolve()
				})
			)
		)
	}
}

module.exports = {
	createBot,
	disconnectAllBots,
}
