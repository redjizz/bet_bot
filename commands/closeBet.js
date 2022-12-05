import { ButtonBuilder, SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder } from '@discordjs/builders';
import { ButtonStyle, EmbedBuilder } from 'discord.js';
import { closeBet, getActiveBets, getBetAnswers, processBetResults } from '../bdd/dbfunc.js'

export const data = new SlashCommandBuilder()
	.setName('closebet')
	.setDescription('Clotûrer un bet')
	.addStringOption(option => 
		option.setName('title')
			.setDescription('Titre du bet à clôturer')
			.setRequired(true)
			.setAutocomplete(true)
	)
export async function execute(interaction) {
	try {
		const answers = await getBetAnswers(interaction.options.getString('title').split('////')[0])
		const select = new SelectMenuBuilder()
			.setCustomId('answerselect ' + interaction.id)
			.setPlaceholder('Réponse correcte')
		answers.forEach(a=>{
			select.addOptions({
				label: a.answer,
				value: a.ind.toString()
			})
		})
		const btn = new ButtonBuilder()
			.setCustomId('validateclose ' + interaction.id)
			.setLabel('Valider')
			.setStyle(ButtonStyle.Primary)
		const row = new ActionRowBuilder()
			.addComponents(select)
		const row2 = new ActionRowBuilder()
			.addComponents(btn)
		await interaction.editReply("Bet en cours de fermeture.")
		await interaction.followUp({content:"Choisir une réponse", components : [row, row2], ephemeral : true})

		const collector = interaction.channel.createMessageComponentCollector({time : 30000})
		let answer = null

		collector.on('collect', async i=>{
			if(i.customId === 'answerselect ' + interaction.id){
				await i.deferUpdate()
				answer = i.values[0]
			}
			if ((i.customId === 'validateclose ' + interaction.id) && answer){
				await i.deferUpdate()
				let res = await closeBet(interaction.options.getString('title').split('////')[0], answer)
				let embed = new EmbedBuilder()
					.setTitle('Résultat du bet : ' + interaction.options.getString('title').split('////')[1])
					.setDescription('Les gains réalisés sont les suivants :')
					.setTimestamp()
					.setColor(0x0099FF)
				for (let el of res) {
					const us = await i.guild.members.fetch(el.guildMemberId)
					if(el.gains !== 0){
						embed.addFields({name: us.displayName, value :'+' + el.gains})
					}
				}
				await i.deleteReply()
				await interaction.editReply({content : 'Bet clôturé. Réponse validée : ' + answers.find(a=>a.ind==answer).answer, embeds : [embed], components : []})
				await processBetResults(res, interaction.guild.id)
			}
		})

	} catch (error) {
		console.error("Erreur lors de la commande closeBet", error)
	}
}

export async function autocomplete(interaction){
	const activeBets = await getActiveBets(interaction.member.id)
	const focusedValue = interaction.options.getFocused();
	const filtered = activeBets.filter(choice => choice.title.startsWith(focusedValue));
	await interaction.respond(
		filtered.map(choice => ({ name: choice.title, value: choice.id + "////" + choice.title })),
	)
}