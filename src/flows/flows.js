import { addKeyword, EVENTS, utils } from '@builderbot/bot'
import { apiFront } from '../openAi/aiFront.js'
import { getUser, registerUser, updateHistorial } from '../queries/queries.js'
import { join } from 'path'

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
	async (ctx, { flowDynamic, gotoFlow, state }) => {
		const user = await getUser(ctx.from)
		await state.update({ user })

		if (!user) {
			await registerUser(ctx.from)
			let hist = []
			const random = Math.floor(Math.random() * 2 + 1)
			console.log(random)
			if (random == 1) {
				hist = [
					{
						role: 'assistant',
						content:
							'***Se acaban de enviar fotos del producto*** (no hay más, el usuario ya vio todas)',
					},
				]
				await updateHistorial(ctx.from, hist)
				return gotoFlow(mediaFlow)
			} else {
				hist = [
					{
						role: 'user',
						content: ctx.body,
					},
				]
				await updateHistorial(ctx.from, hist)
				await flowDynamic(await apiFront(hist, ctx.from, ctx.body))
			}
		} else {
			await flowDynamic(await apiFront(user.historial, ctx.from, ctx.body))
		}
	}
)

const mediaFlow = addKeyword(utils.setEvent('MEDIA'))
	.addAnswer(`Send image from Local`, {
		media: join(process.cwd(), 'assets', 'img1.jpg'),
	})
	.addAnswer(`Send image from Local`, {
		media: join(process.cwd(), 'assets', 'img2.png'),
	})
	.addAnswer(`Send image from Local`, {
		media: join(process.cwd(), 'assets', 'img3.jpg'),
	})
	.addAnswer(`Send image from Local`, {
		media: join(process.cwd(), 'assets', 'img4.png'),
	})
	.addAnswer(`Send image from Local`, {
		media: join(process.cwd(), 'assets', 'img5.jpg'),
	})
	.addAnswer(`Send image from Local`, {
		media: join(process.cwd(), 'assets', 'img6.jpg'),
	})
	.addAnswer(`Send image from Local`, {
		media: join(process.cwd(), 'assets', 'img7.jpg'),
	})
	.addAnswer(`Send video from Local`, {
		media: join(process.cwd(), 'assets', 'vid1.mp4'),
	})

/*
const discordFlow = addKeyword('doc').addAnswer(
    ['You can see the documentation here', '📄 https://builderbot.app/docs \n', 'Do you want to continue? *yes*'].join(
        '\n'
    ),
    { capture: true },
    async (ctx, { gotoFlow, flowDynamic }) => {
        if (ctx.body.toLocaleLowerCase().includes('yes')) {
            return gotoFlow(registerFlow)
        }
        await flowDynamic('Thanks!')
        return
    }
)

const welcomeFlow = addKeyword(['hi', 'hello', 'hola'])
    .addAnswer(`🙌 Hello welcome to this *Chatbot*`)
    .addAnswer(
        [
            'I share with you the following links of interest about the project',
            '👉 *doc* to view the documentation',
        ].join('\n'),
        { delay: 800, capture: true },
        async (ctx, { fallBack }) => {
            if (!ctx.body.toLocaleLowerCase().includes('doc')) {
                return fallBack('You should type *doc*')
            }
            return
        },
        [discordFlow]
    )

const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW'))
    .addAnswer(`What is your name?`, { capture: true }, async (ctx, { state }) => {
        await state.update({ name: ctx.body })
    })
    .addAnswer('What is your age?', { capture: true }, async (ctx, { state }) => {
        await state.update({ age: ctx.body })
    })
    .addAction(async (_, { flowDynamic, state }) => {
        await flowDynamic(`${state.get('name')}, thanks for your information!: Your age: ${state.get('age')}`)
    })

const fullSamplesFlow = addKeyword(['samples', utils.setEvent('SAMPLES')])
    .addAnswer(`💪 I'll send you a lot files...`)
    .addAnswer(`Send image from Local`, { media: join(process.cwd(), 'assets', 'sample.png') })
    .addAnswer(`Send video from URL`, {
        media: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTJ0ZGdjd2syeXAwMjQ4aWdkcW04OWlqcXI3Ynh1ODkwZ25zZWZ1dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LCohAb657pSdHv0Q5h/giphy.mp4',
    })
    .addAnswer(`Send audio from URL`, { media: 'https://cdn.freesound.org/previews/728/728142_11861866-lq.mp3' })
    .addAnswer(`Send file from URL`, {
        media: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    })
*/
