const { AudioPlayer, createAudioResource} = require('@discordjs/voice');
const {SlashCommandBuilder} = require('discord.js')

const data = new SlashCommandBuilder()
	.setName('play')
	.setDescription('OOOOH MY GOD');

async function execute(interaction, connection) {
    const audioPlayer = new AudioPlayer()
    const audioResource = createAudioResource('./oh-my-god-vine.mp3')
	connection.subscribe(audioPlayer)
    audioPlayer.play(audioResource)
    await interaction.reply('Reproduciendo...')
}

module.exports = {data, execute}