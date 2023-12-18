const path = require('path');
const fs = require('fs')

function getCommands(){
    // Obtengo un arreglo con los path de cada comando
    const foldersPath = path.join(path.resolve(__dirname, '..'), 'slash_commands');
    const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));
    
    const commands = [];
    
    // Guardo en 'commands' cada comando
    for (const file of commandFiles) {
        const filePath = path.join(foldersPath, file);
        const command = require(filePath);
        // En data se encuentra el SlashCommandBuilder que contiene la informacion del comando
        if ('data' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`El comando en ${filePath} no tiene una propiedad "data" o "execute".`);
        }
    }
    
    return commands
}

module.exports = getCommands