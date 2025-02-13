import XLSX from 'xlsx'
import cron from 'node-cron'
import axios from 'axios'
import { prisma } from '../queries/queries.js'

// Función para exportar la base de datos a un archivo Excel
async function exportToExcel() {
	try {
		// Obtener todos los usuarios de la base de datos
		const users = await prisma.user.findMany()

		// Crear una hoja de trabajo con los datos
		const worksheet = XLSX.utils.json_to_sheet(users)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')

		// Guardar el archivo Excel
		const filePath = './assets/users_export.xlsx'
		XLSX.writeFile(workbook, filePath)

		console.log('Base de datos exportada a Excel correctamente.')
		return filePath
	} catch (error) {
		console.error('Error al exportar la base de datos a Excel:', error)
		throw error
	}
}

// Función para enviar el archivo Excel a un número específico
async function sendExcelToNumber(filePath, number) {
	try {
		const urlMedia = `http://localhost:${process.env.PORT || 3000}/v1/messages`
		const message = 'Aquí tienes el archivo Excel con la base de datos.'

		// Enviar el archivo Excel
		await axios.post(urlMedia, {
			number: number,
			message: message,
			urlMedia: filePath,
		})

		console.log(`Archivo Excel enviado a ${number} correctamente.`)
	} catch (error) {
		console.error('Error al enviar el archivo Excel:', error)
		throw error
	}
}

// Función principal que exporta y envía el archivo Excel
async function exportAndSend(number) {
	try {
		const filePath = await exportToExcel()
		await sendExcelToNumber(filePath, number)
	} catch (error) {
		console.error('Error en el proceso de exportación y envío:', error)
	}
}

// Programar la tarea cada 12 horas (2am-2pm y 2pm-2am)
function scheduleExportAndSend(number) {
	// cron.schedule('0 2,14 * * *', () => {
	cron.schedule('* * * * *', () => {
		console.log('Ejecutando tarea programada de exportación y envío...')
		exportAndSend(number)
	})
}

export { exportAndSend, scheduleExportAndSend }
