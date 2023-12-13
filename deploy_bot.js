const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const {TOKEN, SERVER_ID, CLIENT_ID} = process.env

const commands = [];

// Obtengo un arreglo de carpetas donde se encuentran los comandos
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Obtengo todos los archivos de comandos que hay en la carpeta
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	
	// Guardo en 'commands' el SlashCommandBuilder de cada comando
	// El SlashCommandBuilder contiene la informacion del comando
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`El comando en ${filePath} no tiene una propiedad "data" o "execute".`);
		}
	}
}

const rest = new REST().setToken(TOKEN);

// Despliego los comandos
(async () => {
	try {
		console.log(`Subo ${commands.length} comandos a la app.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, SERVER_ID),
			{ body: commands },
		);

		console.log(`Los ${data.length} comandos fueron subidos con exito!.`);
	} catch (error) {
		console.error(error);
	}
})();