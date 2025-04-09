const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { createBot, disconnectAllBots } = require('./bot.js')

// Обработка выхода
process.on('SIGINT', async () => {
	console.log('Завершение работы...')
	await disconnectAllBots()
	process.exit(0)
})

process.on('SIGTERM', async () => {
	console.log('Завершение работы...')
	await disconnectAllBots()
	process.exit(0)
})

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 720,
		resizable: false,
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	})

	win.loadFile('index.html')
}

app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

// Обработка событий от renderer процесса
ipcMain.on('disconnect-all-bots', async () => {
	await disconnectAllBots()
})

app.on('before-quit', async () => {
	await disconnectAllBots()
})

// Добавляем обработчик для принудительной сборки мусора
ipcMain.on('force-gc', () => {
	if (global.gc) {
		// Вызываем сборщик мусора
		global.gc();
		console.log('Принудительная сборка мусора выполнена');
	} else {
		console.log('Сборка мусора недоступна. Запустите приложение с параметром --expose-gc');
	}
});
