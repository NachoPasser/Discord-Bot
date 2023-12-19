require('dotenv').config();
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { AudioPlayer, joinVoiceChannel } = require('@discordjs/voice');
const { TOKEN, CLIENT_ID } = process.env
const { playSongText } = require('./text_commands/play')
const { checkUserBotAreInSameChannel } = require('./middleware/checkUserBotSameChannel');
const stopSong = require('./button_commands/stop');
const skipSong = require('./button_commands/skip');
const { playSongSlash } = require('./slash_commands/play');
const deployCommandsOnGuild = require('./deploy_bot_server');
const http = require('http');
const { createEnqueueEmbedMessage, inactivityEmbed, disconnectedEmbed } = require('./middleware/embeds');

const requestListener = function (req, res) {
}
const server = http.createServer(requestListener);
server.listen(8080);

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

// Cuando el bot ingresa a un nuevo servidor, se suben sus comandos
client.on('guildCreate', async (guild) => {
	deployCommandsOnGuild(guild.id)
})

// Función para agregar canciones a la lista
function addSongToQueue(track){
	tracks.push(track)
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
		await stopSong(interaction, audioPlayer, connection)
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
		const embed = createEnqueueEmbedMessage(data, tracks)
		
		return await interaction.reply({embeds: [embed]})
	}

	if(!connection){ // Si el bot no está conectado a un canal de voz
        connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator
        });
    }

	// Si no, la reproduzco
	await playSongSlash(interaction, audioPlayer, tracks.length, connection)
	lastTrackChannel = interaction.channel
});

// Responde a los comandos de texto (!)
client.on(Events.MessageCreate, async message => {


	if(message.content.startsWith('!yt')){
		
		//Me gustaria enviarlos como ephemeral messages pero actualmente no es posible
		if (!message.member.voice?.channel){
			return await message.reply(':crying_cat_face: Conectaté a un canal de voz')
		} 
	
		if (!checkUserBotAreInSameChannel(message)){
			return await message.reply(':crying_cat_face: No estás en el mismo canal que yo.')
		} 

		if(audioPlayer.state.status === 'playing'){ //Si se está reproduciendo una canción
			const data = {event: message, type: 'message'}
			
			addSongToQueue(data) //La sumo a la lista
			const embed = createEnqueueEmbedMessage(data, tracks)
			
			return await message.channel.send({ embeds: [embed] })
		}
		
		if(!connection){ // Si el bot no está conectado a un canal de voz
			connection = joinVoiceChannel({
				channelId: message.member.voice.channel.id,
				guildId: message.guild.id,
				adapterCreator: message.guild.voiceAdapterCreator
			});
		}

		// Si no, la reproduzco
		await playSongText(message, audioPlayer, tracks.length, connection)
		lastTrackChannel = message.channel
		
	}
})

let timeoutTillDisconect = null
// Response cuando el reproductor de musica cambia de estado
audioPlayer.on('stateChange', async (oldState, newState) => {
	// Elimino el contador de inactividad
	clearTimeout(timeoutTillDisconect)

	// El bot se desconecta tras 3 minutos de inactividad
	if(newState.status === 'idle'){
		timeoutTillDisconect = setTimeout(() => {
			connection.destroy() // Desconecto al bot
		}, 180000);
	}

	// Cuando la canción termina y hay canciones pendientes a reproducir
	if(oldState.status === 'playing' && newState.status === 'idle' && tracks.length){
		const actualTrack = tracks.shift() //Obtengo y quito la canción de la lista
		// La reproduzco
		if(actualTrack.type === 'interaction') await playSongSlash(actualTrack.event, audioPlayer, tracks.length, connection)
		
		else playSongText(actualTrack.event, audioPlayer, tracks.length, connection)
	}
})

// Lo agrego para mantenimiento
audioPlayer.on('error', (error) => {
	console.log(error)
})

// Cuando se desconecta el bot
client.on('voiceStateUpdate', async (oldVoiceState, newVoiceState) => {
	if(!newVoiceState.channelId && newVoiceState.id === CLIENT_ID){
		connection = null
		tracks = []
		audioPlayer.stop()
		lastTrackChannel.send({embeds: [disconnectedEmbed]}) // Envio aviso al ultimo canal de texto donde se comunicaron con el bot
	}
})



