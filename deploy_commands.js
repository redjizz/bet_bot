import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { REST, Routes } from 'discord.js';
import { token, guildId, clientId } from './config.js';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url))

const commands = [];
const hidden = []
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
// const hiddenPath = join(commandsPath, 'hidden')
// const hiddenFiles = readdirSync(hiddenPath).filter(file=>file.endsWith('.js'))

for (const file of commandFiles) {
	const filePath = join(commandsPath, file);
	const converted = pathToFileURL(filePath).href
	const command = await import(converted);
	if (command.data) {
		commands.push(command.data.toJSON());
	}
}

// for (const file of hiddenFiles) {
// 	const filePath = join(hiddenPath, file);
// 	const converted = pathToFileURL(filePath).href
// 	const command = await import(converted);
// 	if (command.data) {
// 		hidden.push(command.data.toJSON());
// 	}
// }

const rest = new REST({ version: '10' }).setToken(token);

const data = await rest.put(Routes.applicationCommands(clientId), { body: commands })

console.log(data)

// rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: hidden })
// 	.then(() => console.log('Successfully registered hidden application commands.'))
// 	.catch(console.error)

