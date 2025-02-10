/*  ------------------------ aiFront.js ------------------------
    Actualizado con Function Calling
	-----------------------------------------------------------
*/

import OpenAI from 'openai'
import { mainPrompt } from '../utils/prompts.js'
import { updateHistorial } from '../queries/queries.js'

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
				properties: {
					tipo: {
						type: 'string',
						enum: ['fotos', 'video'],
					},
				},
				required: ['tipo'],
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
				},
				required: ['nombre', 'telefono', 'direccion', 'tipo_envio'],
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
			const toolResponses = await handleTools(responseMessage.tool_calls)
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

async function handleTools(toolCalls) {
	const responses = []

	for (const toolCall of toolCalls) {
		const { name, arguments: args } = toolCall.function

		try {
			let result
			switch (name) {
				case 'enviar_material_visual':
					result = await enviarMaterial(args.tipo)
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

async function enviarMaterial(tipo) {
	const medios = {
		fotos: ['https://ejemplo.com/foto1.jpg', 'https://ejemplo.com/foto2.jpg'],
		video: 'https://ejemplo.com/video-demo.mp4',
	}
	return { urls: medios[tipo] }
}

async function registrarPedido(datos) {
	// Lógica para guardar en tu base de datos
	console.log('Pedido registrado:', datos)
	return {
		success: true,
		orderId: `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
	}
}
