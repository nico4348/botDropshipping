import { addKeyword, EVENTS } from '@builderbot/bot'
import { apiFront } from '../openAi/aiFront.js'
import { getUser, registerUser, updateHistorial } from '../queries/queries.js'
import { whisperTranscript } from '../openAi/whisper.js'
import fs from 'fs/promises'

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
	async (ctx, { flowDynamic, state }) => {
		const user = await getUser(ctx.from)
		await state.update({ user })

		if (!user) {
			await registerUser(ctx.from)
			let hist = []

			hist = [
				{
					role: 'user',
					content: ctx.body,
				},
			]
			await updateHistorial(ctx.from, hist)
			await flowDynamic(await apiFront(hist, ctx.from, ctx.body))
		} else {
			await flowDynamic(await apiFront(user.historial, ctx.from, ctx.body))
		}
	}
)

// AUDIO FLOW: Manejo de notas de voz
export const audioFlow = addKeyword(EVENTS.VOICE_NOTE)
	.addAction(async (ctx, { flowDynamic }) => {
		// Mensaje inicial o acción personalizada
		await flowDynamic('¡Gracias por tu nota de voz! Procesando...')
	})
	.addAnswer({ capture: true }, async (ctx, { flowDynamic, provider, state }) => {
		try {
			console.log(`Procesando nota de voz de: ${ctx.from}`)

			// Guardar el archivo de audio localmente
			const localPath = await provider.saveFile(ctx, {
				path: './assets',
			})

			// Transcribir el audio usando Whisper
			const audio = String(await whisperTranscript(localPath))

			// Eliminar el archivo temporal
			await fs.unlink(localPath)

			console.log(`${ctx.from} dijo: ${audio}`)

			const user = await getUser(ctx.from)
			await state.update({ user })

			if (!user) {
				await registerUser(ctx.from)
				let hist = []

				hist = [
					{
						role: 'user',
						content: audio,
					},
				]
				await updateHistorial(ctx.from, hist)
				await flowDynamic(await apiFront(hist, ctx.from, audio))
			} else {
				await flowDynamic(await apiFront(user.historial, ctx.from, audio))
			}
		} catch (error) {
			console.error(`Error procesando nota de voz de ${ctx.from}:`, error)
			await flowDynamic('Lo siento, hubo un error procesando tu nota de voz.')
		}
	})
