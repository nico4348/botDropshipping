/*  ------------------------ aiFront.js ------------------------
    Actualizado con Function Calling
	-----------------------------------------------------------
*/

import OpenAI from 'openai'
import { mainPrompt } from '../utils/prompts.js'
import { updateHistorial } from '../queries/queries.js'
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
			description: 'Registra los datos del cliente para finalizar la compra',
			parameters: {
				type: 'object',
				properties: {
					nombre: { type: 'string' },
					telefono: { type: 'string' },
					direccion: { type: 'string' },
					tipo_envio: {
						type: 'string',
						enum: ['domicilio', 'oficina'],
					},
					cantidad: { type: 'number' },
				},
				required: ['nombre', 'telefono', 'direccion', 'tipo_envio', 'cantidad'],
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

		// Manejar llamadas a funciones
		if (responseMessage.tool_calls) {
			const toolResponses = await handleTools(responseMessage.tool_calls, celular)
			conversationHistory.push(responseMessage)
			conversationHistory.push(...toolResponses)
		} else {
			conversationHistory.push({
				role: 'assistant',
				content: responseMessage.content,
			})
		}

		conversationHistory.shift() // Remover system prompt temporal
		await updateHistorial(celular, conversationHistory)

		return responseMessage.content || 'Pedido procesado correctamente ✅'
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
					result = await registrarPedido(args)
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

async function registrarPedido(datos) {
	// Lógica para guardar en tu base de datos
	console.log('Pedido registrado:', datos)
	return {
		success: true,
		orderId: `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
	}
}
