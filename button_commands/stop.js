async function stopSong(interaction, audioPlayer, connection){
    interaction.deferUpdate()	
    if(audioPlayer.state.status === 'playing'){
        connection.destroy()
    }
    return;
}

module.exports = stopSong