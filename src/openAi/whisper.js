import fs from 'fs'
import OpenAI from 'openai'

const whisper = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

export async function whisperTranscript(audioUrl) {
	const transcription = await whisper.audio.transcriptions.create({
		file: fs.createReadStream(audioUrl),
		model: 'whisper-1',
		language: 'es',
	})

	const textTranscribed = transcription.text
	console.log(textTranscribed)
	return textTranscribed
}
