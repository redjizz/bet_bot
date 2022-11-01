import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder} from '@discordjs/builders';
import { ButtonStyle, EmbedBuilder, InteractionCollector, SelectMenuBuilder, TextInputStyle } from 'discord.js';
import { createBet, placeBet } from '../bdd/dbfunc.js';

export const data = new SlashCommandBuilder()
	.setName('createbet')
	.setDescription('Creates a new bet.')
    .setDMPermission(false)
    .addStringOption(o=>
        o.setName('title').setDescription('Intitulé du bet.').setRequired(true)
    )
export async function execute(interaction) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('primary2 ' + interaction.id)
                .setLabel('2')
                .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId('primary3 ' + interaction.id)
                .setLabel('3')
                .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId('primary4 ' + interaction.id)
                .setLabel('4')
                .setStyle(ButtonStyle.Primary),
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId('primary5 ' + interaction.id)
                .setLabel('5')
                .setStyle(ButtonStyle.Primary),
        )

	await interaction.editReply({content: 'Combien de réponses possibles pour le bet ?', components: [row]})

    const filter = i => i.customId.startsWith('primary') && i.user == interaction.user

    const collector = interaction.channel.createMessageComponentCollector(filter, 15000);

    collector.on('collect', async i => {
        try {
            if (!(i.customId.startsWith('primary') && i.user == interaction.user && i.customId.endsWith(interaction.id))) return
            let n = parseInt(i.customId.split(' ')[0].slice(-1))
            let inp = {}
            let comp = []
            const mod = new ModalBuilder()
                .setTitle(interaction.options.getString('title'))
                .setCustomId("betmodal" + interaction.id)
            for (let j = 1; j <= n; j++){
                inp[j] = new TextInputBuilder()
                    .setCustomId(("input "+j).toString())
                    .setLabel("Réponse " + j)
                    .setStyle(TextInputStyle.Short)
                inp["action " + j] = new ActionRowBuilder().addComponents(inp[j])
                comp.push(inp["action " + j])
            }
            mod.addComponents(comp)
            await i.showModal(mod)
        } catch (error) {
            console.error("collector1 error", error)
        }

    });

    const filter2 = i => i.customId == "betmodal" + interaction.id

    const collector2 = new InteractionCollector(interaction.client, {filter : filter2, time : 15000})

    collector2.on('collect', async i => {
        try {
            if(i.customId !== "betmodal" + interaction.id) return
            await i.deferUpdate()
            await createBet(interaction.id, interaction.guild.id, interaction.member.id, i.fields.fields.map(a=>a.value), interaction.options.getString('title'))
            let embed = new EmbedBuilder()
                .setTitle(`Un nouveau bet a été créé par ${interaction.member.displayName}`)
                .setDescription(interaction.options.getString('title'))
                .setTimestamp()
                .setColor(0x0099FF)
            let p = 0
            interaction.answers = []
            i.fields.fields.forEach((f)=>{p++; interaction.answers.push(f.value);return embed.addFields({name : `Réponse ${p}`, value : f.value, inline : true})})
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('participate ' + interaction.id)
                        .setLabel("Participer")
                        .setStyle(ButtonStyle.Primary)
                )
            await interaction.followUp({embeds : [embed], components : [row]})
        } catch (error) {
            console.error("collector2 error", error)
        }
    })

    const collector3 = interaction.channel.createMessageComponentCollector({time : 120000})

    collector3.on('collect', async i => {
        try {
            if (i.customId !== 'participate ' + interaction.id) return
            await i.deferUpdate()
            const select = new SelectMenuBuilder()
                .setCustomId('participateSelect ' + interaction.id)
                .setPlaceholder('Réponse choisie')
            interaction.answers.forEach(a=>{
                select.addOptions({
                    label: a,
                    value: (interaction.answers.indexOf(a) + 1).toString()
                })
            })
            const row = new ActionRowBuilder()
                .addComponents(select)
            await i.followUp({content:"Choisir une réponse", components : [row], ephemeral : true})
        } catch (error) {
            console.error("collector3 error", error)
        }
    })

    const collector4 = interaction.channel.createMessageComponentCollector({time : 120000})

    collector4.on('collect', async i =>{
        try {
            if (i.customId !== 'participateSelect ' + interaction.id) return
            const mod = new ModalBuilder()
                .setTitle(interaction.options.getString('title'))
                .setCustomId("participateModal " + interaction.id)
            const inp = new TextInputBuilder()
                .setCustomId('mise ' + i.values[0])
                .setLabel(`Réponse : ${interaction.answers[i.values[0] - 1]}`)
                .setPlaceholder('Points à miser')
                .setStyle(TextInputStyle.Short)
            const inpRow = new ActionRowBuilder().addComponents(inp)
            mod.addComponents(inpRow)
            await i.showModal(mod)
        } catch (error) {
            console.error("collector4 error", error)
        }
    })

    const filter4 = i => i.customId == 'participateModal ' + interaction.id

    const collector5 = new InteractionCollector(interaction.client, {filter: filter4, time : 120000})

    collector5.on('collect', async i =>{
        try {
            if (i.customId !== 'participateModal ' + interaction.id) return
            await i.deferUpdate()
            await placeBet(interaction.id, i.member.id, parseInt(i.fields.components[0].components[0].customId.split(' ')[1]), i.fields.fields.at(0).value, interaction.guild.id)
            await i.followUp({content : `Vous avez placé ${i.fields.fields.at(0).value} points sur la réponse ${i.fields.components[0].components[0].customId.split(' ')[1]}`, ephemeral : true})
        } catch (error) {
            console.error("collector5 error", error)
        }
    })

    collector5.on('end', async collected =>{
        try {
            interaction.followUp({content : `${collected.size} personnes participent au bet.`})
        } catch (error) {
            console.error("coll5 end", error)
        }
    })

}
