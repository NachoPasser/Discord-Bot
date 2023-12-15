const {ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js')
const { createAudioResource} = require('@discordjs/voice');
const { joinVoiceChannel} = require('@discordjs/voice');
const play = require('play-dl'); // Everything
const axios = require('axios');
const { checkUserBotAreInSameChannel } = require('../middleware/checkUserBotSameChannel');
const { API_KEY } = process.env

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

async function playSong(message, audioPlayer){
    //Me gustaria enviarlos como ephemeral messages pero actualmente no es posible
    if (!message.member.voice?.channel) return await message.reply('❌ Conectaté a un canal de voz')
    
    if (!checkUserBotAreInSameChannel(message)) return await message.reply('❌ No estás en el mismo canal que yo.')
    
    const connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
    })
    
    let query = message.content.split('!yt ')[1]
    
    if(!query) return message.reply('❌ Agregá una canción')
    
    const params = {
        key: API_KEY, // API Key de Youtube API
        q: query, // Término que deseas buscar en los videos de YouTube
        part: 'snippet', // Datos que recibo de la búsqueda
        type: 'video' // Tipo de dato que recibo
    };
    
    const response = await axios.get(`https://youtube.googleapis.com/youtube/v3/search`, {params});
    const videoId = response.data.items[0].id.videoId;
    const source = await play.stream(`https://www.youtube.com/watch?v=${videoId}`)
    const audioResource = createAudioResource(source.stream, {
        inputType : source.type
    })
    connection.subscribe(audioPlayer)
    audioPlayer.play(audioResource)
    
    const channel = message.channel
    channel.send({content: `Reproduciendo https://www.youtube.com/watch?v=${videoId}`, components: [row]})
}

module.exports = { playSong }