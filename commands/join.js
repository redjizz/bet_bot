import { SlashCommandBuilder } from '@discordjs/builders';
import { join } from '../bdd/dbfunc.js';

export const data = new SlashCommandBuilder()
	.setName('join')
	.setDescription('Creates an account for the BET BOT');
export async function execute(interaction) {
    try {
        await join(interaction.member)
        await interaction.editReply('Compte créé !')
    } catch (error) {
        console.error("Erreur lors du join", error)
    }
}