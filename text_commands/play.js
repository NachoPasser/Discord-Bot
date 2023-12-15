const {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} = require('discord.js')
const { createAudioResource} = require('@discordjs/voice');
const { joinVoiceChannel} = require('@discordjs/voice');
const play = require('play-dl'); // Everything
const axios = require('axios');
const { checkUserBotAreInSameChannel } = require('../middleware/checkUserBotSameChannel');
const { API_KEY } = process.env

function createEmbedMessage(message, video, queuedTracks){
    
    const sentence = queuedTracks === 1 ? 'canción' : 'canciones'
    const avatarURL = `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}`
    const snippet = video.snippet
    
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`${snippet.title}`)
        .setURL(`https://www.youtube.com/watch?v=${video.id.videoId}`)
        .setAuthor({ name: 'Ahora suena', iconURL: 'https://i.imgur.com/3QhLUzq.png' })
        .setThumbnail(`${snippet.thumbnails.high.url}`)
        .addFields({ name: 'En cola', value: `\`\`${queuedTracks} ${sentence}\`\``, inline: true })
        .setTimestamp()
        .setFooter({ text: `Pedida por ${message.author.displayName}`, iconURL: `${avatarURL}` });
    
    return embed
}


const skip = new ButtonBuilder()
.setCustomId('Saltear')
.setLabel('Saltear')
.setStyle(ButtonStyle.Primary);

const stop = new ButtonBuilder()
.setCustomId('Detener')
.setLabel('Detener')
.setStyle(ButtonStyle.Danger);

const row = new ActionRowBuilder()
.addComponents(stop, skip);    

async function playSong(message, audioPlayer, queuedTracks){
    //Me gustaria enviarlos como ephemeral messages pero actualmente no es posible
    if (!message.member.voice?.channel) return await message.reply(':crying_cat_face: Conectaté a un canal de voz')
    
    if (!checkUserBotAreInSameChannel(message)) return await message.reply(':crying_cat_face: No estás en el mismo canal que yo.')
    
    let query = message.content.split('!yt ')[1]
    
    if(!query) return message.reply(':crying_cat_face: Agregá una canción')

    const connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
    })
    
    const params = {
        key: API_KEY, // API Key de Youtube API
        q: query, // Término que deseas buscar en los videos de YouTube
        part: 'snippet', // Datos que recibo de la búsqueda
        type: 'video', // Tipo de dato que recibo
    };
    
    const response = await axios.get(`https://youtube.googleapis.com/youtube/v3/search`, {params});
    const video = response.data.items[0]
    const source = await play.stream(`https://www.youtube.com/watch?v=${video.id.videoId}`)
    const audioResource = createAudioResource(source.stream, {
        inputType : source.type
    })
    connection.subscribe(audioPlayer)
    audioPlayer.play(audioResource)
    
    const channel = message.channel
    const embed = createEmbedMessage(message, video, queuedTracks)
    const reply = channel.send({ embeds: [embed], components: [row]});

    const collector = channel.createMessageComponentCollector()

    collector.on("collect", async () => {
        row.components[0].setDisabled(true)
        row.components[1].setDisabled(true)
        reply.edit({ embeds: [embed], components: [row] })
    })

    return connection
}

module.exports = { playSong }