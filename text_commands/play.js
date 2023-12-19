const {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, } = require('discord.js')
const { createAudioResource } = require('@discordjs/voice');
const play = require('play-dl');
const getVideoFromYt = require('../middleware/getVideoFromYt');
const { createPlayEmbedMessage } = require('../middleware/embeds');
const { API_KEY } = process.env

// Función para enviar respuestas con botones
function sendButtonResponse() {
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

    return row
}
  
async function playSongText(message, audioPlayer, queuedTracks, connection){

    let query = message.content.split('!yt ')[1]
    
    if(!query){
        await message.reply(':crying_cat_face: Agregá una canción')
        return;
    }

    const params = {
        key: API_KEY, // API Key de Youtube API
        q: query, // Término que deseas buscar en los videos de YouTube
        part: 'snippet', // Datos que recibo de la búsqueda
        type: 'video', // Tipo de dato que recibo
    };
    
    const channel = message.channel

    try {
        const video = await getVideoFromYt(params)
        
        if(!video){
            await channel.send({ content: ':crying_cat_face: No se encontró ningún video' });
            return;
        }
        
        const source = await play.stream(`https://www.youtube.com/watch?v=${video.id.videoId}`)
        const audioResource = createAudioResource(source.stream, {
            inputType : source.type
        })
        connection.subscribe(audioPlayer)
        audioPlayer.play(audioResource)
        
        const data = {event: message, type: 'message'}
        const embed = createPlayEmbedMessage(data, video, queuedTracks)
        
        const row = sendButtonResponse()

        const reply = await channel.send({ embeds: [embed], components: [row]});
        
        // Cuando termina la canción, se deshabilitan los botones
        audioPlayer.on('stateChange', (oldState, newState) => {
            if (newState.status === 'idle' || newState.status === 'autopaused') {
                row.components[0].setDisabled(true)
                row.components[1].setDisabled(true)
                reply.edit({ embeds: [embed], components: [row] })
            }
        });
        
    } catch (error) {
        console.log(connection)
        console.log(error)
        let reason = error.message
        let message = ':crying_cat_face: '
        switch(reason){
            case 'Unexpected':
                message += 'Ocurrio un error inesperado!'
                break;
            case 'Quota Exceeded':
                const timeWhereQuotaReset = new Date();
                // Establezco la hora en 8:00 AM UTC (hora donde se reinicia la cuota)
                timeWhereQuotaReset.setUTCHours(8, 0, 0, 0); 
                message += `La cuota diaria fue superada, espere hasta las ${timeWhereQuotaReset.toLocaleTimeString()}.`
                break;
        }
        await channel.send({ content: message });
    }
}

module.exports = { playSongText }