const { checkUserBotAreInSameChannel } = require("../middleware/checkUserBotSameChannel");
const { TEXT_CHANNEL_ID } = process.env

async function skipSong(message, client, audioPlayer) {
    const channel = await client.channels.fetch(TEXT_CHANNEL_ID);

    if (!message.member.voice?.channel) return channel.send('❌ Conectaté a un canal de voz')

    if (!checkUserBotAreInSameChannel(message)) return channel.send('❌ No estás en el mismo canal de voz que Tibu.')

    audioPlayer.stop()
    channel.send('Canción salteada')
}

module.exports = { skipSong }