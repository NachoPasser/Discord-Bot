require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { AudioPlayer } = require('@discordjs/voice');
const { TOKEN } = process.env
const { playSong } = require('./text_commands/play')
const { skipSong } = require('./text_commands/skip')
const { checkUserBotAreInSameChannel } = require('./middleware/checkUserBotSameChannel');


// Creo la instancia del cliente
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
//Creo la coleccion de comandos
client.commands = new Collection();

//Creo el reproductor de musica
const audioPlayer = new AudioPlayer()

const foldersPath = path.join(__dirname, 'slash_commands');
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

//Responde a los comandos (/) y pulsados de botones
client.on(Events.InteractionCreate, async interaction => {
	
	if (!interaction.member.voice?.channel) return await interaction.reply({content: '❌ Conectaté a un canal de voz', ephemeral: true})
    
    if (!checkUserBotAreInSameChannel(interaction)) return await interaction.reply({content: '❌ No estás en el mismo canal que yo.', ephemeral: true})
	
	
	const audioPlayerStatus = audioPlayer.state.status
	if(interaction.customId === 'Detener'){
		interaction.deferUpdate(); //Para que no responda a la interacción
		if(!(audioPlayerStatus === 'playing')) return; //Si no se está reproduciendo nada
		
		audioPlayer.stop();
		return await interaction.channel.send('👋 Se detuvo la reproducción')
	}
	
	if(interaction.customId === 'Saltear'){ //Si cola no está vacia
		interaction.deferUpdate(); //Para que no responda a la interacción
		if(!(audioPlayerStatus === 'playing')) return; //Si no se está reproduciendo nada
		
		audioPlayer.stop();
		return await interaction.channel.send('👋 No quedan canciones para reproducir')
	} 
	
	const commandName = interaction.commandName
	const command = client.commands.get(commandName);

	try{
	   await command.execute(interaction, audioPlayer)
	} catch(error){
		console.log(error)
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'Ocurrio un error inesperado!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'Ocurrio un error inesperado!', ephemeral: true });
		}
	}

});

//Responde a los comandos de texto (!)
client.on(Events.MessageCreate, async message => {
	if (message.content.startsWith('!yt')) return playSong(message, audioPlayer)
})