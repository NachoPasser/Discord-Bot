const {SlashCommandBuilder} = require('discord.js')

const data = new SlashCommandBuilder()
	.setName('skip')
	.setDescription('Saltea la cancion')

async function execute(interaction, args) {
    const {audioPlayer} = args
    audioPlayer.stop()
    await interaction.reply('Canción salteada')
}

module.exports = {data, execute}