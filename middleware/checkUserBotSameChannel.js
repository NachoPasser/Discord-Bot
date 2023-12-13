const { BOT_ID } = process.env

// Obtengo el id del canal en el que está conectado el usuario
function getVoiceChannelId(event, userId) {
    let member = event.type === 0 
    ?  event.guild.members.cache.get(userId)
    :  event.member.guild.members.cache.get(userId);;
    if (member && member.voice.channel) {
      return member.voice.channel.id;
    }
    return null;
}

function checkUserBotAreInSameChannel(event){
    //Ejecuto uno u otro dependiendo de si el evento es un comando (/) o comando (!)
    const userChannelID = event.type === 0 
                        ? getVoiceChannelId(event, event.author.id)
                        : getVoiceChannelId(event, event.user.id)
    const botChannelID = getVoiceChannelId(event, BOT_ID)

    //Si el bot está en un canal
    if(botChannelID) return botChannelID === userChannelID
    
    return true;
}

module.exports = { checkUserBotAreInSameChannel }