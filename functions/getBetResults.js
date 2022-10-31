export function getBetResults(registry, answer){
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
    registry.forEach(r=>{
        const win = r.answer == answer ? 1 : 0
        r.gains = parseInt(cotes.find(c=>c.answer == r.answer).cote * r.points * win)
    })
    return registry
}

// let tester = [ {
//     eventId: '1036612324712263720',
//     guildMemberId: '95523913689206784',
//     answer: 2,
//     points: 1332,
//   }]

// getBetResults(tester, 2)