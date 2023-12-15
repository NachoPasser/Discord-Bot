require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { AudioPlayer } = require('@discordjs/voice');
const { TOKEN } = process.env
const { playSong } = require('./text_commands/play')
const { checkUserBotAreInSameChannel } = require('./middleware/checkUserBotSameChannel');


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

// Función para ejecutar comandos
async function executeCommand(interaction){
	const commandName = interaction.commandName
	const command = client.commands.get(commandName);

	try{
		return await command.execute(interaction, audioPlayer, tracks.length)
	} catch(error){
		console.log(error)
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: ':crying_cat_face: Ocurrio un error inesperado!', ephemeral: true });
		} else {
			await interaction.reply({ content: ':crying_cat_face: Ocurrio un error inesperado!', ephemeral: true });
		}
	}
}

// Responde a los comandos (/) y pulsados de botones
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.member.voice?.channel) return await interaction.reply({content: ':crying_cat_face:  Conectaté a un canal de voz', ephemeral: true})

    if (!checkUserBotAreInSameChannel(interaction)) return await interaction.reply({content: ':crying_cat_face:  No estás en el mismo canal que yo.', ephemeral: true})
	
	const audioPlayerStatus = audioPlayer.state.status
	if(interaction.customId === 'Detener'){
		if(!(audioPlayerStatus === 'playing')) return interaction.deferUpdate();; //Si no se está reproduciendo nada
		
		tracks = []
		audioPlayer.stop();
		connection.disconnect()

		const embed = new EmbedBuilder()
		.setColor(0x00008b)
		.setAuthor({name: 'Desconectado'})
		.setDescription(':zzz: Chau, me voy a dormir')

		return await interaction.reply({embeds: [embed]})
	}
	
	if(interaction.customId === 'Saltear'){
		interaction.deferUpdate(); //Para que no responda a la interacción
		audioPlayer.stop();

		const embed = new EmbedBuilder()
		.setColor(0xFFB347)
		.setAuthor({name: 'Cola terminada'})
		.setDescription('No quedan más canciones por reproducir :smirk_cat:')

		if(audioPlayerStatus === 'playing' && !tracks.length) await interaction.channel.send({embeds: [embed]})
		
		return;
	} 
	
	if(audioPlayer.state.status === 'playing'){ //Si se está reproduciendo una canción
		const data = {event: interaction, type: 'interaction'}
		
		addSongToQueue(data) //La sumo a la lista
		const embed = createEnqueueEmbedMessage(data)
		
		return await interaction.reply({embeds: [embed]})
	}
	
	// Si no, la reproduzco
	connection = await executeCommand(interaction)

});

// Responde a los comandos de texto (!)
client.on(Events.MessageCreate, async message => {
	
	if(message.content.startsWith('!yt')){
		
		if(audioPlayer.state.status === 'playing'){ //Si se está reproduciendo una canción
			const data = {event: message, type: 'message'}
			
			addSongToQueue(data) //La sumo a la lista
			const embed = createEmbedMessage(data)

			return await message.channel.send({ embeds: [embed] })
		}
		
		// Si no, la reproduzco
		return playSong(message, audioPlayer, tracks.length)
		
	}
})

audioPlayer.on('stateChange', async (oldState, newState) => {

	// El bot se desconecta tras 3 minutos de inactividad
	let timeoutTillDisconect = null
	if(newState.status === 'idle'){
		timeoutTillDisconect = setTimeout(() => {
			connection.disconnect()
		}, 180000);
	}

	// Cuando la canción termina y hay canciones pendientes a reproducir
	if(oldState.status === 'playing' && newState.status === 'idle' && tracks.length){
		clearTimeout(timeoutTillDisconect)
		const actualTrack = tracks.shift() //Obtengo y quito la canción de la lista
		
		if(actualTrack.type === 'interaction') await executeCommand(actualTrack.event)
		
		else playSong(actualTrack.event, audioPlayer, tracks.length)
	}
})


