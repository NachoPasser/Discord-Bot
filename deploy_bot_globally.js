const { Client, GatewayIntentBits, Events } = require('discord.js');
const deployCommandsOnGuild = require('./deploy_bot_server');
require('dotenv').config();
const { TOKEN } = process.env

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let iterator = null

// Se ejecuta cuando el cliente está listo. Sube los comandos.
client.once(Events.ClientReady, async readyClient => {
	console.log(`Listo! Logueado como ${readyClient.user.tag}`);
	iterator = readyClient.guilds.cache.keys() //Obtengo un iterador con la id de cada servidor
	await deployCommandsOnAllGuilds(iterator)
	client.destroy()
});

// El bot se loguea en discord usando el token
client.login(TOKEN);

// Voy iterando y desplegando los comandos en cada servidor
async function deployCommandsOnAllGuilds(iterator){
	const guildId = iterator.next().value
	if(!guildId) return
	await deployCommandsOnGuild(guildId)
	deployCommandsOnAllGuilds(iterator)
}