/*  ------------------------ aiFront.js ------------------------
    Actualizado con Function Calling
	-----------------------------------------------------------
*/

import OpenAI from 'openai'
import { mainPrompt } from '../utils/prompts.js'
import { updateHistorial, updateUser } from '../queries/queries.js'
import axios from 'axios'
import { join } from 'path'

const aiFront = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

// Definición de herramientas (functions)
const tools = [
	{
		type: 'function',
		function: {
			name: 'enviar_material_visual',
			description: 'Envía fotos/video del producto cuando solicitado',
			parameters: {
				type: 'object',
				properties: {},
				required: [],
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'registrar_pedido',
			description:
				'Registra los datos del cliente para finalizar la compra, despues de que el usuario haya confirmado su informacion',
			parameters: {
				type: 'object',
				properties: {
					nombre: { type: 'string' },
					telefono: { type: 'string' },
					direccion: { type: 'string' },
					ciudad: { type: 'string' },
					tipo_envio: {
						type: 'string',
						enum: ['domicilio', 'oficina'],
					},
					cantidad: { type: 'number' },
				},
				required: ['nombre', 'telefono', 'direccion', 'ciudad', 'tipo_envio', 'cantidad'],
			},
		},
	},
]

export async function apiFront(conversationHistory, celular, msg) {
	try {
		conversationHistory.push({ role: 'user', content: msg })
		conversationHistory.unshift({ role: 'system', content: mainPrompt })

		const completion = await aiFront.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: conversationHistory,
			temperature: 0.6,
			tools: tools,
			tool_choice: 'auto',
		})

		const responseMessage = completion.choices[0].message
		let toolResponses
		// Manejar llamadas a funciones
		if (responseMessage.tool_calls) {
			toolResponses = await handleTools(responseMessage.tool_calls, celular)
			console.log(toolResponses)
			conversationHistory.push(responseMessage)
			conversationHistory.push(...toolResponses)
			if (toolResponses[0].name == 'registrar_pedido') {
				const msg =
					'Tu pedido de la cámara retrovisor quedó registrado\n\nRecibirás confirmación vía WhatsApp antes del despacho. 📦✅'
				conversationHistory.push({
					role: 'user',
					content: msg,
				})
				conversationHistory.shift() // Remover system prompt temporal
				await updateHistorial(celular, conversationHistory)
				return msg
			} else {
				const msg =
					'Ahi te envie algunas fotos, Si tienes alguna duda sobre las caracteristicas me avisas'
				conversationHistory.push({
					role: 'user',
					content: msg,
				})
				conversationHistory.shift() // Remover system prompt temporal
				await updateHistorial(celular, conversationHistory)
				return msg
			}
		} else {
			conversationHistory.push({
				role: 'assistant',
				content: responseMessage.content,
			})
		}

		conversationHistory.shift() // Remover system prompt temporal
		await updateHistorial(celular, conversationHistory)
		return responseMessage.content
	} catch (error) {
		console.error('Error en apiFront:', error)
		return 'Ocurrió un error, por favor intenta nuevamente'
	}
}

async function handleTools(toolCalls, celular) {
	const responses = []

	for (const toolCall of toolCalls) {
		const { name, arguments: args } = toolCall.function

		try {
			let result
			switch (name) {
				case 'enviar_material_visual':
					result = await enviarMaterial(celular)
					break
				case 'registrar_pedido':
					result = await registrarPedido(celular, args)
					break
			}

			responses.push({
				role: 'tool',
				tool_call_id: toolCall.id,
				name: name,
				content: JSON.stringify(result),
			})
		} catch (error) {
			console.error(`Error en ${name}:`, error)
			responses.push({
				role: 'tool',
				tool_call_id: toolCall.id,
				name: name,
				content: 'Error procesando la solicitud',
			})
		}
	}

	return responses
}

async function enviarMaterial(celular) {
	try {
		await axios.post('http://localhost:3000/v1/messages', {
			number: celular, // Asegúrate de reemplazar esto con el número real del cliente
			message: '1',
			urlMedia: join(process.cwd(), 'assets', 'img1.jpg'), // URL real de tu media
		})
		await axios.post('http://localhost:3000/v1/messages', {
			number: celular, // Asegúrate de reemplazar esto con el número real del cliente
			message: '2',
			urlMedia: join(process.cwd(), 'assets', 'img2.png'), // URL real de tu media
		})
		await axios.post('http://localhost:3000/v1/messages', {
			number: celular, // Asegúrate de reemplazar esto con el número real del cliente
			message: '3',
			urlMedia: join(process.cwd(), 'assets', 'img3.jpg'), // URL real de tu media
		})
		return 'Check, imagenes enviadas'
	} catch (error) {
		console.error('Error al enviar material visual:', error)
		return { success: false, error: 'Error al enviar material visual' }
	}
}

// eslint-disable-next-line no-unused-vars
async function registrarPedido(cel, datos) {
	datos = JSON.parse(datos)
	try {
		await updateUser(cel, datos)
		return { success: true, message: 'Pedido registrado exitosamente' }
	} catch (error) {
		console.error('Error al registrar pedido:', error)
		return { success: false, error: 'Error al registrar pedido' }
	}
}
