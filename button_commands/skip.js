const { EmbedBuilder } = require("discord.js");

async function skipSong(interaction, audioPlayer, tracksLeft){
    interaction.deferUpdate(); //Para que no responda a la interacción
    audioPlayer.stop();

    const embed = new EmbedBuilder()
    .setColor(0xFFB347)
    .setAuthor({name: 'Cola terminada'})
    .setDescription('No quedan más canciones por reproducir :smirk_cat:')

    if(audioPlayer.state.status === 'playing' && !tracksLeft) await interaction.channel.send({embeds: [embed]})
    
    return;
}

module.exports = skipSong