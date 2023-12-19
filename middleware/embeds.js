const { EmbedBuilder } = require("discord.js")

const disconnectedEmbed = new EmbedBuilder()
    .setColor(0x00008b)
    .setAuthor({name: 'Desconectado'})
    .setDescription(':zzz: Me voy a dormir')

const emptyQueueEmbed = new EmbedBuilder()
    .setColor(0xFFB347)
    .setAuthor({name: 'Cola terminada'})
    .setDescription('No quedan más canciones por reproducir :smirk_cat:')

// Función para crear el embed message cuando agrego una cancion
function createEnqueueEmbedMessage(data, numberTracks){
    const {event, type} = data
	const query = type === 'message'
				? event.content.split('!yt ')[1]
				: event.options._hoistedOptions[0].value
	
	const user = type === 'message'
				? event.author
				: event.user

	const sentence = numberTracks === 1 ? 'canción' : 'canciones'
	const avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`

	const embed = new EmbedBuilder()
	.setColor(0x0B6E4F)
	.setAuthor({ name: 'Canción agregada', iconURL: 'https://i.imgur.com/3QhLUzq.png' })
	.setThumbnail('https://i.imgur.com/YvNmFaK.png')
	.addFields(
		{ name: 'En cola', value: `\`\`${numberTracks} ${sentence}\`\``, inline: true }, 
		{name: 'Término', value: `${query}`, inline: true}
	)
	.setTimestamp()
	.setFooter({ text: `Agregada por ${user.displayName}`, iconURL: `${avatarURL}` });
	
	return embed
}

// Función para crear el embed message cuando reproduzco una canción
function createPlayEmbedMessage(data, video, queuedTracks){
    const user = data.type === 'message'
				? data.event.author
				: data.event.user

    const sentence = queuedTracks === 1 ? 'canción' : 'canciones'
    const avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
    const snippet = video.snippet
    
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`${snippet.title}`)
        .setURL(`https://www.youtube.com/watch?v=${video.id.videoId}`)
        .setAuthor({ name: 'Ahora suena', iconURL: 'https://i.imgur.com/3QhLUzq.png' })
        .setThumbnail(`${snippet.thumbnails.high.url}`)
        .addFields({ name: 'En cola', value: `\`\`${queuedTracks} ${sentence}\`\``, inline: true })
        .setTimestamp()
        .setFooter({ text: `Pedida por ${user.displayName}`, iconURL: `${avatarURL}` });
    
    return embed
}

module.exports = {
    disconnectedEmbed, 
    emptyQueueEmbed, 
    createEnqueueEmbedMessage, 
    createPlayEmbedMessage
}
