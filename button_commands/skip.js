const { emptyQueueEmbed } = require("../middleware/embeds");

async function skipSong(interaction, audioPlayer, tracksIsEmpty){
    interaction.deferUpdate(); //Para que no responda a la interacción
    audioPlayer.stop();

    if(audioPlayer.state.status === 'playing' && tracksIsEmpty) await interaction.channel.send({embeds: [emptyQueueEmbed]})
    
    return;
}

module.exports = skipSong