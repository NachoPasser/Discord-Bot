require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { AudioPlayer } = require('@discordjs/voice');
const { joinVoiceChannel} = require('@discordjs/voice');
const {CHANNEL_ID, TOKEN} = process.env


// Creo la instancia del cliente
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
//Creo la coleccion de comandos
client.commands = new Collection();

//Creo el reproductor de musica
const audioPlayer = new AudioPlayer()

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`El comando en ${filePath} no tiene una propiedad "data" o "execute".`);
		}
	}
}

//Se ejecuta una sola vez. En este caso cuando el cliente esta listo.
let connection=0;
client.once(Events.ClientReady, async readyClient => {
	console.log(`Listo! Logueado como ${readyClient.user.tag}`);
    await client.channels.fetch(CHANNEL_ID)
    const channel = client.channels.cache.get(CHANNEL_ID)
    connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator
    });

});

// El bot se loguea en discord usando el token
client.login(TOKEN);


client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const commandName = interaction.commandName
	const command = client.commands.get(commandName);
	if (!command) {
		console.error(`El comando ${commandName} no existe.`);
		return;
	}
	
	let args = {}
	switch(commandName){
		case 'play':
			args.connection = connection
			args.audioPlayer = audioPlayer
			break;
		case 'skip':
			args.audioPlayer = audioPlayer
			break;
	}

	try {
		await command.execute(interaction, args);
	} catch (error) {
		console.log(error)
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'Ocurrio un error!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'Ocurrio un error!', ephemeral: true });
		}
	}
});