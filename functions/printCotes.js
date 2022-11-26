import { getCotes } from "../bdd/dbfunc.js";

export async function printCotes(interaction, embed){
    try {
        const cotes = await getCotes(interaction.id)
        embed.setFields()
        interaction.answers.forEach(f=>{
            const co = cotes.find(c=>c.answer == f.index) ? cotes.find(c=>c.answer == f.index).cote.toString().slice(0,4) : 'inf'
            embed.addFields({name : `Réponse ${f.index}`, value : `${f.value} (cote : ${co}) `, inline : true})
        })
        await interaction.editReply({embeds : [embed]})
    } catch (error) {
        console.error("Erreur lors du printCotes :", error)
    }
}