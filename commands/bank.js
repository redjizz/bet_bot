import { SlashCommandBuilder } from '@discordjs/builders';
import { getPoints } from '../bdd/dbfunc.js';

export const data = new SlashCommandBuilder()
	.setName('bank')
	.setDescription('Voir son total de points.');
export async function execute(interaction) {
    try {
        const points = await getPoints(interaction)
        await interaction.editReply(`Vous avez actuellement ${points} points sur votre compte!`)
    } catch (error) {
        console.error("Erreur lors du join", error)
    }
}