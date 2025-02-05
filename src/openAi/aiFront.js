/*  ------------------------ aiFront.js ------------------------
	Este archivo se encarga de manejar la conexion con OpenAI
    Especificamente es para las respuestas con IA 
	Front solo se usa para respuestas de Whatsapp
	-----------------------------------------------------------
*/

import OpenAI from 'openai'
import { mainPrompt } from '../utils/prompts.js'
import { updateHistorial } from '../queries/queries.js'

const aiFront = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

export async function apiFront(conversationHistory, celular, msg) {
	conversationHistory.push({ role: 'user', content: msg })
	conversationHistory.unshift({ role: 'system', content: mainPrompt })

	const completion = await aiFront.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: conversationHistory,
		temperature: 0.6,
	})

	const responseFront = completion.choices[0].message.content
	conversationHistory.push({ role: 'assistant', content: responseFront })
	conversationHistory.shift()
	await updateHistorial(celular, conversationHistory)

	return responseFront
}
