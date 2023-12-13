const { createAudioResource} = require('@discordjs/voice');
const {SlashCommandBuilder} = require('discord.js')
const { joinVoiceChannel} = require('@discordjs/voice');
const play = require('play-dl'); // Everything
const axios = require('axios');
const { checkUserBotAreInSameChannel } = require('../middleware/checkUserBotSameChannel');
const { API_KEY } = process.env

const data = new SlashCommandBuilder()
	.setName('play')
	.setDescription('Pone una canción de Youtube')
    .addStringOption(option =>
		option.setName('canción')
			.setDescription('Link o título de la canción')
            .setRequired(true));

async function execute(interaction, audioPlayer) {

    if (!interaction.member.voice?.channel) return await interaction.reply('❌ Conectaté a un canal de voz')

    if (!checkUserBotAreInSameChannel(interaction)) return await interaction.reply('❌ No estás en el mismo canal de voz que Tibu.')

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
    const videoId = response.data.items[0].id.videoId;
    const source = await play.stream(`https://www.youtube.com/watch?v=${videoId}`)
    const audioResource = createAudioResource(source.stream, {
        inputType : source.type
    })
    connection.subscribe(audioPlayer)
    audioPlayer.play(audioResource)
    await interaction.reply(`Reproduciendo https://www.youtube.com/watch?v=${videoId}`)
}

module.exports = {data, execute}