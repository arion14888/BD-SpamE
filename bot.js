const { Client } = require('teeworlds')

let activeBots = []

async function createBot(serverIp, serverPort, nickname) {
	// Проверяем, что IP и порт переданы
	if (!serverIp || !serverPort) {
		throw new Error('Не указан IP или порт сервера')
	}

	const randomNum = Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, '0')
	// Проверяем, передан ли никнейм и не пустой ли он
	const botName =
		nickname && nickname.trim() !== ''
			? `${nickname}${randomNum}` // Если есть никнейм, добавляем к нему цифры
			: randomNum // Если никнейма нет, используем только цифры

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
	})

	client.on('connected', () => {
		console.log(`Бот ${botName} подключился!`)
	})

	client.on('disconnect', reason => {
		console.log(`Бот ${botName} отключился: ${reason}`)
	})

	activeBots.push(client)
	// Убираем автоматическое подключение
	return client
}

async function disconnectAllBots() {
	console.log('Отключаем всех ботов...')

	// Создаем копию массива
	const botsToDisconnect = [...activeBots]

	// Сразу очищаем основной массив
	activeBots = []

	// Отключаем каждого бота
	for (const bot of botsToDisconnect) {
		try {
			bot.Disconnect()
		} catch (error) {
			console.error('Ошибка при отключении бота:', error)
			// Пробуем еще раз через setTimeout
			setTimeout(() => {
				try {
					bot.Disconnect()
				} catch (e) {
					console.error('Повторная ошибка при отключении бота:', e)
				}
			}, 100)
		}
	}
}

async function botCycle(serverIp, serverPort, message) {
	while (true) {
		const bots = []

		for (let i = 1; i <= 3; i++) {
			const bot = await createBot(serverIp, serverPort, message)
			bots.push(bot)
			await new Promise(resolve => setTimeout(resolve, 100))
		}

		await new Promise(resolve => setTimeout(resolve, 10))

		for (const bot of bots) {
			await bot.Disconnect()
			activeBots = activeBots.filter(b => b !== bot)
			await new Promise(resolve => setTimeout(resolve, 100))
		}
	}
}

module.exports = {
	createBot,
	disconnectAllBots,
	botCycle,
}
