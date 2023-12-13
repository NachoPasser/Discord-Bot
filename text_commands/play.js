const { createAudioResource} = require('@discordjs/voice');
const { joinVoiceChannel} = require('@discordjs/voice');
const play = require('play-dl'); // Everything
const axios = require('axios');
const { checkUserBotAreInSameChannel } = require('../middleware/checkUserBotSameChannel');
const { API_KEY, TEXT_CHANNEL_ID } = process.env

async function playSong(message, client, audioPlayer){
    const channel = await client.channels.fetch(TEXT_CHANNEL_ID);

    if (!message.member.voice?.channel) return channel.send('❌ Conectaté a un canal de voz')
    
    if (!checkUserBotAreInSameChannel(message)) return channel.send('❌ No estás en el mismo canal de voz que Tibu.')
    
    const connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
    })
    
    let query = message.content.split('!yt ')[1]

    if(!query) return channel.send(':warning: Agregá una canción')

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
    channel.send(`Reproduciendo https://www.youtube.com/watch?v=${videoId}`)
}

module.exports = { playSong }