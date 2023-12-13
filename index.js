require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { AudioPlayer } = require('@discordjs/voice');
const { TOKEN } = process.env
const { playSong } = require('./text_commands/play')
const { skipSong } = require('./text_commands/skip')


// Creo la instancia del cliente
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
//Creo la coleccion de comandos
client.commands = new Collection();

//Creo el reproductor de musica
const audioPlayer = new AudioPlayer()

const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(foldersPath, file);
	const command = require(filePath);
	
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`El comando en ${filePath} no tiene una propiedad "data" o "execute".`);
	}
}

//Se ejecuta una sola vez. En este caso cuando el cliente esta listo.
client.once(Events.ClientReady, async readyClient => {
	console.log(`Listo! Logueado como ${readyClient.user.tag}`);
});

// El bot se loguea en discord usando el token
client.login(TOKEN);

//Responde a los comandos (/)
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const commandName = interaction.commandName
	const command = client.commands.get(commandName);
	if (!command) {
		console.error(`El comando ${commandName} no existe.`);
		return;
	}

	try {
		await command.execute(interaction, audioPlayer);
	} catch (error) {
		console.log(error)
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'Ocurrio un error!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'Ocurrio un error!', ephemeral: true });
		}
	}
});

//Responde a los comandos de texto (!)
client.on(Events.MessageCreate, async message => {
	if (message.content.startsWith('!')) {
		
		switch(message.content.slice(0, 3)){
			case '!yt':
				playSong(message, client, audioPlayer)
				break;
			case '!s':
				skipSong(message, client, audioPlayer)
				break;
		}
    }
})