const getCommands = require("./middleware/getCommands")
const { REST, Routes } = require('discord.js');
require('dotenv').config();
const { TOKEN, CLIENT_ID } = process.env

async function deployCommandsOnGuild(guildId){
    const commands = getCommands()
    const rest = new REST().setToken(TOKEN);
    // Despliego los comandos en un servidor especifico
    try {
        console.log(`Subo ${commands.length} comandos al servidor.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, guildId),
            { body: commands },
        );

        console.log(`Los ${data.length} comandos fueron subidos con exito!.`);
    } catch (error) {
        console.error(error);
    }
}

module.exports = deployCommandsOnGuild