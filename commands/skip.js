const {SlashCommandBuilder} = require('discord.js')
const { checkUserBotAreInSameChannel } = require('../middleware/checkUserBotSameChannel')

const data = new SlashCommandBuilder()
	.setName('skip')
	.setDescription('Saltea la canción')

async function execute(interaction, audioPlayer) {
    
    if (!interaction.member.voice?.channel) return await interaction.reply('❌ Conectaté a un canal de voz')
    
    if (!checkUserBotAreInSameChannel(interaction)) return await interaction.reply('❌ No estás en el mismo canal de voz que Tibu.')
   
    audioPlayer.stop()
    await interaction.reply('Canción salteada')
}

module.exports = {data, execute}