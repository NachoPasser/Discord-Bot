const { EmbedBuilder } = require("discord.js");

async function stopSong(interaction, audioPlayer, connection){
    if(!(audioPlayer.state.status === 'playing')) return interaction.deferUpdate(); //Si no se está reproduciendo nada
		
    audioPlayer.stop();
    connection.destroy()

    const embed = new EmbedBuilder()
    .setColor(0x00008b)
    .setAuthor({name: 'Desconectado'})
    .setDescription(':zzz: Me voy a dormir')

    await interaction.reply({embeds: [embed]})
    return null
    
}

module.exports = stopSong