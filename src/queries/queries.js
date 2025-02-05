import Prisma from '@prisma/client'
export const prisma = new Prisma.PrismaClient()

//----------------------------------------------

export const registerUser = async (celular) => {
	return await prisma.user.create({
		data: {
			celular,
			historial: [],
		},
	})
}

//----------------------------------------------

export const getUser = async (celular) => {
	return await prisma.user.findUnique({
		where: {
			celular,
		},
	})
}

//----------------------------------------------

//*Ejemplo data: { nombre: 'John Doe', ciudad: 'Bogotá' }

export const updateUser = async (celular, data) => {
	return await prisma.user.update({
		where: {
			celular,
		},
		data,
	})
}

//----------------------------------------------

export const updateHistorial = async (celular, historial) => {
	return await prisma.user.update({
		where: {
			celular,
		},
		data: {
			historial,
		},
	})
}
