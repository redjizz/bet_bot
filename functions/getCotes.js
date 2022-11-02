export async function getCotes(registry){
    let tot = 0
    let r = registry.reduce((acc, curr)=>{
        tot = tot + curr.points
        if (!acc.find(a=> a.index == curr.answer)){
            let temp = {
                index : curr.answer,
                mises : [{guildMemberId : curr.guildMemberId, value : curr.points}],
                points : curr.points
            }
            acc.push(temp)
        } else {
            let temp = acc.find(a=> a.index == curr.answer)
            temp.mises.push({guildMemberId : curr.guildMemberId, value : curr.points})
            temp.points = temp.points + curr.points
        }
        return acc
    },[])
    let cotes = []
    r.forEach(a=>{
        const c = tot / a.points
        cotes.push({answer : a.index, cote : c})
    })
    return cotes
}