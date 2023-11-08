import { Client, GatewayIntentBits, Collection } from "discord.js";
import { token } from "./config.js"
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

//GLOBAL VARIABLES
const __dirname = dirname(fileURLToPath(import.meta.url));
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let up = false

//IMPORT COMMANDS MODULES

client.commands = new Collection();

{
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = join(commandsPath, file);
	const converted = pathToFileURL(filePath).href
	const command = await import(converted);
	if(command.data){
		client.commands.set(command.data.name, command);
	}
}}


//IMPORT HIDDEN COMMANDS MODULES

// {
// const commandsPath = join(__dirname, 'commands');
// const hiddenPath = join(commandsPath, 'hidden')
// const commandFiles = readdirSync(hiddenPath).filter(file => file.endsWith('.js'));

// for (const file of commandFiles) {
// 	const filePath = join(hiddenPath, file);
// 	const converted = pathToFileURL(filePath).href
// 	const command = await import(converted);
// 	if(command.data){
// 		client.commands.set(command.data.name, command);
// 	}
// }}



//BOT INITIALIZATION

client.once('ready', async () => {
	up = true
})



//BOT EVENTS

//INTERACTIONS EVENTS
client.on('interactionCreate', async interaction => {
	try {
		if (!interaction.isCommand() && !interaction.isAutocomplete()) return
		if (interaction.guildId == "386210773489287168" && interaction.channelId != "1171863588139442236") return
		if(interaction.isChatInputCommand()){
			if(!up) {
				try {
					await interaction.reply('Bet Bot is booting. Please try again in a few minutes.')
				} catch (error) {
					console.error("Erreur lors de l'envoi du booting message.", error)
				}
				return
			}else if(interaction.isCommand()) await interaction.deferReply()
	
			const command = client.commands.get(interaction.commandName)
	
			if (!command) return;
			
			await command.execute(interaction)
		} else if(interaction.isAutocomplete()){
			if(!up) return
			const command = client.commands.get(interaction.commandName)
			if (!command) return;
			await command.autocomplete(interaction)
		}
	} catch (error) {
		console.error(error)
		try {
			if(interaction.isCommand() && !interaction.deferred) await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
			else if(interaction.isCommand()) await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true })
		} catch (error) {
			console.error("Erreur lors de l'envoi du message d'erreur.", error)
		}
	}
})



client.login(token);