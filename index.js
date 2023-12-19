require('dotenv').config();
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { AudioPlayer, joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');
const { Queue } = require('@datastructures-js/queue');
const { TOKEN, CLIENT_ID } = process.env
const deployCommandsOnGuild = require('./deploy_bot_server');
const { checkUserBotAreInSameChannel } = require('./middleware/checkUserBotSameChannel');
const stopSong = require('./button_commands/stop');
const skipSong = require('./button_commands/skip');
const { playSongSlash } = require('./slash_commands/play');
const { playSongText } = require('./text_commands/play')
const { createEnqueueEmbedMessage, disconnectedEmbed } = require('./middleware/embeds');

const requestListener = function (req, res) {
}
const server = http.createServer(requestListener);
server.listen(8080);

// Creo la instancia del cliente
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Creo la coleccion de comandos
client.commands = new Collection();

// Creo la cola de canciones
let tracks = new Queue();

// Creo el reproductor de musica
const audioPlayer = new AudioPlayer()

// Conexión al chat de voz
let connection = null

// Canal donde se pidio la ultima canción
let lastTrackChannel = null

// Creo la cola de comandos
let commandQueue = new Queue();

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
	tracks.enqueue(track)
}

let processingQueue = false;
// Va procesando cada comando en el orden en que fue ingresado
async function processQueue() {
  processingQueue = true;

  while (!commandQueue.isEmpty()) {
    const { event, type } = commandQueue.dequeue();
	console.log(event)
	console.log('----------------------------------------------------------------------')
	if(type === 'interaction') await executeSlashCommand(event)
	else await executeTextCommand(event)
  }

  processingQueue = false;
}

// Ejecuto comando (/) y pulsados de botones
async function executeSlashCommand(interaction){
	
	// Si se pulso el botón para detener
	if(interaction.customId === 'Detener'){
		await stopSong(interaction, audioPlayer, connection)
		return;
	}
	
	// Si se pulso el botón para saltear
	if(interaction.customId === 'Saltear'){
		await skipSong(interaction, audioPlayer, tracks.isEmpty())
		return;
	} 
	
	// Si se está reproduciendo una canción
	if(audioPlayer.state.status === 'buffering' || audioPlayer.state.status === 'playing'){ 
		const data = {event: interaction, type: 'interaction'}
		
		addSongToQueue(data) // Sumo la nueva canción a la lista
		const embed = createEnqueueEmbedMessage(data, tracks.size())
		
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
	await playSongSlash(interaction, audioPlayer, tracks.size(), connection)
	lastTrackChannel = interaction.channel
}

// Ejecuto comando (!)
async function executeTextCommand(message){
	console.log(audioPlayer.state.status)
	console.log('----------------------------------------------------------------------')
	if(audioPlayer.state.status === 'buffering' || audioPlayer.state.status === 'playing'){ //Si se está reproduciendo una canción
		const data = {event: message, type: 'message'}
		
		addSongToQueue(data) //La sumo a la lista
		const embed = createEnqueueEmbedMessage(data, tracks.size())
		
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
	await playSongText(message, audioPlayer, tracks.size(), connection)
	lastTrackChannel = message.channel
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

	commandQueue.enqueue({event: interaction, type: 'interaction'})

	if(!processingQueue){
		processQueue()
	}
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
		commandQueue.enqueue({event: message, type: 'message'})
		
		if(!processingQueue){
			processQueue()
		}
	}
})

let timeoutTillDisconect = null
// Response cuando el reproductor de musica cambia de estado
audioPlayer.on('stateChange', async (oldState, newState) => {
	
	// Elimino el contador de inactividad
	clearTimeout(timeoutTillDisconect)
	
	// Cuando la canción termina y hay canciones pendientes a reproducir
	if(oldState.status === 'playing' && newState.status === 'idle' && !tracks.isEmpty()){
		const actualTrack = tracks.dequeue() //Obtengo y quito la canción de la cola
		// La reproduzco
		if(actualTrack.type === 'interaction') await playSongSlash(actualTrack.event, audioPlayer, tracks.size(), connection)
		
		else playSongText(actualTrack.event, audioPlayer, tracks.size(), connection)
	}
	
	// El bot se desconecta tras 3 minutos de inactividad
	if(newState.status === 'idle'){
		timeoutTillDisconect = setTimeout(() => {
			connection.destroy() // Desconecto al bot
		}, 180000);
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
		tracks = new Queue()
		audioPlayer.stop()
		lastTrackChannel.send({embeds: [disconnectedEmbed]}) // Envio aviso al ultimo canal de texto donde se comunicaron con el bot
	}
})



