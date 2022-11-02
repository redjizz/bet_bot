import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder} from '@discordjs/builders';
import { ButtonStyle, EmbedBuilder, InteractionCollector, SelectMenuBuilder, TextInputStyle } from 'discord.js';
import { createBet, getCotes, getPoints, placeBet } from '../bdd/dbfunc.js';


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

    const collector = interaction.channel.createMessageComponentCollector(filter, 30000);

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

            const filter2 = i => i.customId == "betmodal" + interaction.id

            const collector2 = new InteractionCollector(interaction.client, {filter : filter2, time : 30000})
        
            collector2.on('collect', async j => {
                try {
                    if(j.customId !== "betmodal" + interaction.id) return
                    await j.deferUpdate()
                    await createBet(interaction.id, interaction.guild.id, interaction.member.id, j.fields.fields.map(a=>a.value), interaction.options.getString('title'))
                    let embed = new EmbedBuilder()
                        .setTitle(`Un nouveau bet a été créé par ${interaction.member.displayName}`)
                        .setDescription(interaction.options.getString('title'))
                        .setTimestamp()
                        .setColor(0x0099FF)
                    let p = 0
                    interaction.answers = []
                    j.fields.fields.forEach((f)=>{p++; interaction.answers.push({index : p, value : f.value});return embed.addFields({name : `Réponse ${p}`, value : f.value, inline : true})})
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('participate ' + interaction.id)
                                .setLabel("Participer")
                                .setStyle(ButtonStyle.Primary)
                        )
                    await interaction.editReply({content : "", embeds : [embed], components : [row]})

                    let nbr = 0
                    const collector3 = interaction.channel.createMessageComponentCollector({time : 120000})
        
                    collector3.on('collect', async k => {
                        try {
                            if (k.customId !== 'participate ' + interaction.id) return
                            await k.deferReply({ephemeral : true})
                            const select = new SelectMenuBuilder()
                                .setCustomId('participateSelect ' + k.id)
                                .setPlaceholder('Réponse choisie')
                            interaction.answers.forEach(a=>{
                                select.addOptions({
                                    label: a.value,
                                    value: (interaction.answers.indexOf(a) + 1).toString()
                                })
                            })
                            const row = new ActionRowBuilder()
                                .addComponents(select)
                            await k.editReply({content:"Choisir une réponse", components : [row], ephemeral : true})
                
                            const collector4 = interaction.channel.createMessageComponentCollector({time : 120000})
                
                            collector4.on('collect', async l =>{
                                try {
                                    if (l.customId !== 'participateSelect ' + k.id) return
                                    const userPoints = await getPoints(l)
                                    const mod = new ModalBuilder()
                                        .setTitle(`Vous disposez de ${userPoints} points.`)
                                        .setCustomId("participateModal " + l.id)
                                    const inp = new TextInputBuilder()
                                        .setCustomId('mise ' + l.values[0])
                                        .setLabel(`Réponse : ${interaction.answers[l.values[0] - 1].value}`)
                                        .setPlaceholder('Points à miser')
                                        .setStyle(TextInputStyle.Short)
                                    const inpRow = new ActionRowBuilder().addComponents(inp)
                                    mod.addComponents(inpRow)
                                    await l.showModal(mod)
                        
                                    const filter4 = i => i.customId == 'participateModal ' + l.id
                        
                                    const collector5 = new InteractionCollector(interaction.client, {filter: filter4, time : 120000})
                                
                                    collector5.on('collect', async m =>{
                                        try {
                                            if (m.customId !== 'participateModal ' + l.id) return
                                            await m.deferUpdate()
                                            nbr++
                                            await placeBet(interaction.id, m.member.id, parseInt(m.fields.components[0].components[0].customId.split(' ')[1]), parseInt(m.fields.fields.at(0).value), interaction.guild.id)
                                            await k.editReply({content : `Vous avez placé ${m.fields.fields.at(0).value} points sur la réponse ${m.fields.components[0].components[0].customId.split(' ')[1]}`, ephemeral : true, components : []})
                                        } catch (error) {
                                            console.error("collector5 error", error)
                                        }
                                    })

                                } catch (error) {
                                    console.error("collector4 error", error)
                                }
                            })
                        } catch (error) {
                            console.error("collector3 error", error)
                        }
                    })

                    collector3.on('end', async collected =>{
                        try {
                            await interaction.editReply({embeds : [embed], components : []})
                            let cotes = await getCotes(interaction.id)
                            embed.setFields()
                            interaction.answers.forEach(a=>{
                                const c = cotes.find(c=>a.index == c.answer)
                                if(c){
                                    embed.addFields({name : 'Réponse : ' + a.value, value : 'Cote : ' + (c.cote).toString().slice(0,4), inline : true})
                                }else{
                                    embed.addFields({name : 'Réponse : ' + a.value, value : 'Cote : Pas de vote', inline : true})
                                }
                            })
                            await interaction.followUp({content : `Participations closes. Le pari compte ${nbr} participants.`, embeds : [embed]})
                        } catch (error) {
                            console.error("coll5 end", error)
                        }
                    })
                } catch (error) {
                    console.error("collector2 error", error)
                }
            })
        } catch (error) {
            console.error("collector1 error", error)
        }

    });

}
