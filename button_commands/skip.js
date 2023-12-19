const { emptyQueueEmbed } = require("../middleware/embeds");

async function skipSong(interaction, audioPlayer, tracksLeft){
    interaction.deferUpdate(); //Para que no responda a la interacción
    audioPlayer.stop();

    if(audioPlayer.state.status === 'playing' && !tracksLeft) await interaction.channel.send({embeds: [emptyQueueEmbed]})
    
    return;
}

module.exports = skipSong