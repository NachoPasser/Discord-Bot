const { createAudioResource} = require('@discordjs/voice');
const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} = require('discord.js')
const { joinVoiceChannel} = require('@discordjs/voice');
const play = require('play-dl'); // Everything
const axios = require('axios');
const { API_KEY } = process.env

function createEmbedMessage(interaction, video, queuedTracks){
    
    const sentence = queuedTracks === 1 ? 'canción' : 'canciones'
    const avatarURL = `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}`
    const snippet = video.snippet
    
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`${snippet.title}`)
        .setURL(`https://www.youtube.com/watch?v=${video.id.videoId}`)
        .setAuthor({ name: 'Ahora suena', iconURL: 'https://i.imgur.com/3QhLUzq.png' })
        .setThumbnail(`${snippet.thumbnails.high.url}`)
        .addFields({ name: 'En cola', value: `\`\`${queuedTracks} ${sentence}\`\``, inline: true })
        .setTimestamp()
        .setFooter({ text: `Pedida por ${interaction.user.displayName}`, iconURL: `${avatarURL}` });
    
    return embed
}

const data = new SlashCommandBuilder()
	.setName('play')
	.setDescription('Pone una canción de Youtube')
    .addStringOption(option =>
		option.setName('canción')
			.setDescription('Link o título de la canción')
            .setRequired(true));

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

async function execute(interaction, audioPlayer, queuedTracks) {

    const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
    });

    const params = {
        key: API_KEY, // API Key de Youtube API
        q: interaction.options._hoistedOptions[0].value, // Término que deseas buscar en los videos de YouTube
        part: 'snippet', // Datos que recibo de la búsqueda
        type: 'video' // Tipo de dato que recibo
    };
    
    const response = await axios.get(`https://youtube.googleapis.com/youtube/v3/search`, {params});
    const video =  response.data.items[0]
    const source = await play.stream(`https://www.youtube.com/watch?v=${video.id.videoId}`)
    
    const audioResource = createAudioResource(source.stream, {
        inputType : source.type
    })

    connection.subscribe(audioPlayer)
    audioPlayer.play(audioResource)

    const embed = createEmbedMessage(interaction,video,queuedTracks)
    
    const reply = await interaction.reply({
        embeds: [embed],
        components: [row]
    })
    
    const collector = interaction.channel.createMessageComponentCollector()

    collector.on("collect", async () => {
        row.components[0].setDisabled(true)
        row.components[1].setDisabled(true)
        reply.edit({ embeds: [embed], components: [row] })
    })

    return connection
    
}

module.exports = {data, execute}