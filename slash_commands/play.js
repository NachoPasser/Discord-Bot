const { createAudioResource} = require('@discordjs/voice');
const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} = require('discord.js')
const play = require('play-dl');
const getVideoFromYt = require('../middleware/getVideoFromYt');
const { createPlayEmbedMessage } = require('../middleware/embeds');
const { API_KEY } = process.env

const data = new SlashCommandBuilder()
	.setName('play')
	.setDescription('Pone una canción de Youtube')
    .addStringOption(option =>
		option.setName('canción')
			.setDescription('Link o título de la canción')
            .setRequired(true));

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

async function playSongSlash(interaction, audioPlayer, queuedTracks, connection) {

    const params = {
        key: API_KEY, // API Key de Youtube API
        q: interaction.options._hoistedOptions[0].value, // Término que deseas buscar en los videos de YouTube
        part: 'snippet', // Datos que recibo de la búsqueda
        type: 'video' // Tipo de dato que recibo
    };
    
    try {
        const video = await getVideoFromYt(params)
        const source = await play.stream(`https://www.youtube.com/watch?v=${video.id.videoId}`)
        
        const audioResource = createAudioResource(source.stream, {
            inputType : source.type
        })
        connection.subscribe(audioPlayer)
        audioPlayer.play(audioResource)
        
        const data = {event: interaction, type: 'interaction'}
        const embed = createPlayEmbedMessage(data,video,queuedTracks)

        const row = sendButtonResponse()

        let reply = null
        
        // Cuando salteo una canción reutilizo la interacción. Como antes respondí con el aviso, no puedo usar reply
        if(interaction.replied){ 
            reply = await interaction.followUp({
                embeds: [embed],
                components: [row]
            })
        } else{
            reply = await interaction.reply({
                embeds: [embed],
                components: [row]
            })
        }

        // Cuando termina la canción, se deshabilitan los botones
        audioPlayer.on('stateChange', (oldState, newState) => {
            if (newState.status === 'idle' || newState.status === 'autopaused') {
                row.components[0].setDisabled(true)
                row.components[1].setDisabled(true)
                if(interaction.replied){ // followUp no retorna un InteractionResponse sino un Message
                    reply.edit({ embeds: [embed], components: [row] }) // Por eso uso un metodo diferente
                } else{
                    reply.interaction.editReply({ embeds: [embed], components: [row] })
                }
            }
        });

    } catch(error){
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

        if (interaction.replied) {
			await interaction.followUp({ content: message, ephemeral: true });
		} else {
			await interaction.reply({ content: message, ephemeral: true });
		}
	}
    
}

module.exports = {data, playSongSlash}