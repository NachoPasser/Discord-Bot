require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { AudioPlayer } = require('@discordjs/voice');
const { TOKEN } = process.env
const { playSongText } = require('./text_commands/play')
const { checkUserBotAreInSameChannel } = require('./middleware/checkUserBotSameChannel');
const stopSong = require('./button_commands/stop');
const skipSong = require('./button_commands/skip');
const { playSongSlash } = require('./slash_commands/play');


// Creo la instancia del cliente
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
// Creo la coleccion de comandos
client.commands = new Collection();

// Creo la lista de canciones
let tracks = []

// Creo el reproductor de musica
const audioPlayer = new AudioPlayer()

// Conexión al chat de voz
let connection = null

// Canal donde se pidio la ultima canción
let lastTrackChannel = null

// Se ejecuta una sola vez. En este caso cuando el cliente esta listo.
client.once(Events.ClientReady, async readyClient => {
	console.log(`Listo! Logueado como ${readyClient.user.tag}`);
});

// El bot se loguea en discord usando el token
client.login(TOKEN);

// Función para agregar canciones a la lista
function addSongToQueue(track){
	tracks.push(track)
}

// Función para crear el embed messages cuando agrego una cancion
function createEnqueueEmbedMessage({event, type}){
	const query = type === 'message'
				? event.content.split('!yt ')[1]
				: event.options._hoistedOptions[0].value
	
	const user = type === 'message'
				? event.author
				: event.user

	const sentence = tracks.length === 1 ? 'canción' : 'canciones'
	const avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`

	const embed = new EmbedBuilder()
	.setColor(0x0B6E4F)
	.setAuthor({ name: 'Canción agregada', iconURL: 'https://i.imgur.com/3QhLUzq.png' })
	.setThumbnail('https://i.imgur.com/YvNmFaK.png')
	.addFields(
		{ name: 'En cola', value: `\`\`${tracks.length} ${sentence}\`\``, inline: true }, 
		{name: 'Término', value: `${query}`, inline: true}
	)
	.setTimestamp()
	.setFooter({ text: `Agregada por ${user.displayName}`, iconURL: `${avatarURL}` });
	
	return embed
}

// Responde a los comandos (/) y pulsados de botones
client.on(Events.InteractionCreate, async interaction => {
	
	if (!interaction.member.voice?.channel){
		return await interaction.reply({
			content: ':crying_cat_face:  Conectaté a un canal de voz', 
			ephemeral: true
		})
	} 

    if (!checkUserBotAreInSameChannel(interaction)){
		return await interaction.reply({
			content: ':crying_cat_face:  No estás en el mismo canal que yo.', 
			ephemeral: true
		})
	} 

	// Si se pulso el botón para detener
	if(interaction.customId === 'Detener'){
		connection = await stopSong(interaction, audioPlayer, connection)
		return;
	}
	
	// Si se pulso el botón para saltear
	if(interaction.customId === 'Saltear'){
		await skipSong(interaction, audioPlayer, tracks.length)
		return;
	} 
	
	// Si se está reproduciendo una canción
	if(audioPlayer.state.status === 'playing'){ 
		const data = {event: interaction, type: 'interaction'}
		
		addSongToQueue(data) // Sumo la nueva canción a la lista
		const embed = createEnqueueEmbedMessage(data)
		
		return await interaction.reply({embeds: [embed]})
	}

	// Si no, la reproduzco
	connection = await playSongSlash(interaction, audioPlayer, tracks.length, connection)
	lastTrackChannel = interaction.channel
});

// Responde a los comandos de texto (!)
client.on(Events.MessageCreate, async message => {
	
	if(message.content.startsWith('!yt')){
		if(audioPlayer.state.status === 'playing'){ //Si se está reproduciendo una canción
			const data = {event: message, type: 'message'}
			
			addSongToQueue(data) //La sumo a la lista
			const embed = createEnqueueEmbedMessage(data)
			
			return await message.channel.send({ embeds: [embed] })
		}
		
		// Si no, la reproduzco
		connection = await playSongText(message, audioPlayer, tracks.length, connection)
		lastTrackChannel = message.channel
		
	}
})

let timeoutTillDisconect = null
audioPlayer.on('stateChange', async (oldState, newState) => {

	// Elimino el contador de inactividad
	clearTimeout(timeoutTillDisconect)

	// El bot se desconecta tras 3 minutos de inactividad
	if(newState.status === 'idle'){
		timeoutTillDisconect = setTimeout(() => {
			const embed = new EmbedBuilder()
			.setColor(0x00008b)
			.setAuthor({name: 'Desconectado por inactividad'})
			.setDescription(':zzz: Me voy a dormir')
			connection.destroy()
			connection = null
			lastTrackChannel.send({embeds: [embed]})
		}, 180000);
	}

	// Cuando la canción termina y hay canciones pendientes a reproducir
	if(oldState.status === 'playing' && newState.status === 'idle' && tracks.length){
		const actualTrack = tracks.shift() //Obtengo y quito la canción de la lista
		
		if(actualTrack.type === 'interaction') await playSongSlash(actualTrack.event, audioPlayer, tracks.length, connection)
		
		else playSongText(actualTrack.event, audioPlayer, tracks.length, connection)
	}
})


