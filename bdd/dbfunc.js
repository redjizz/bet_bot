import * as mariadb from 'mariadb'
import {bddLogs, guildId} from '../config.js'
import { getBetResults } from '../functions/getBetResults.js';
import { getCotes as getCotesFun } from '../functions/getCotes.js';
import { BDDname } from './BDDname.js';

const tempPool = mariadb.createPool(bddLogs);

function isValid(str){
    return !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str);
   }

export async function BDDconnect(bddName){
    try{
        let conn = await tempPool.getConnection()
        await conn.query("use " + bddName)
        return conn
    } catch (error){console.error("Erreur lors de l'initialisation de la connexion à la BDD", error)}
}

export async function createBet(id, guildId, guildMemberId, answers, title){
    const tester = answers.concat([title])
    if(!tester.every(a=>isValid(a))) throw("danger")
    const conn = await BDDconnect(BDDname)
    await conn.query(`insert into events (id, start, guildMemberId, guildId, title) values (${id}, NOW(), ${guildMemberId}, ${guildId}, "${title}")`)
    await Promise.all(answers.map((a, index) => conn.query(`insert into betanswers (eventId, answer, ind) values (${id}, "${a}", ${index + 1})`)))
    if(conn){await conn.end()}
}

export async function placeBet(id, guildMemberId, answer, points, guildId){
    if(!isValid(answer)) throw('danger')
    const conn = await BDDconnect(BDDname)
    await conn.query(`insert into registry (eventId, guildMemberId, answer, points) values (${id}, ${guildMemberId}, "${answer}", ${points})`)
    await updatePoints(-points, guildMemberId, guildId)
    await updateAnswerPoints(id, answer, points)
    if(conn){await conn.end()}
}

export async function getActiveBets(guildMemberId){
    const conn = await BDDconnect(BDDname)
    const activeBets = await conn.query(`select * from events where guildMemberId = "${guildMemberId}" AND end is null limit 10`)
    if(conn){await conn.end()}
    return activeBets
}

export async function getBetAnswers(eventId){
    const conn = await BDDconnect(BDDname)
    const answers = await conn.query(`select * from betanswers where eventId = "${eventId}" limit 10`)
    if(conn){await conn.end()}
    return answers
}

export async function closeBet(eventId, answerIndex){
    const conn = await BDDconnect(BDDname)
    const data = await conn.query(`select * from registry where eventId = "${eventId}"`)
    if(conn){await conn.end()}
    return getBetResults(data, answerIndex)
}

export async function processBetResults(results, guildId){
    const conn = await BDDconnect(BDDname)
    await Promise.all(results.filter(r=>r.gains != 0).map(element => updatePoints(element.gains, element.guildMemberId, guildId)))
    await conn.query(`update events set end = NOW() where id = ${results[0].eventId}`)
    if(conn){await conn.end()}
}

export async function join(guildMember){
    const conn = await BDDconnect(BDDname)
    await conn.query('insert ignore into users (guildId, userId, guildMemberId) values (?,?,?)', [guildMember.guild.id, guildMember.user.id, guildMember.id])
    if(conn){await conn.end()}
}

export async function updatePoints(points, guildMemberId, guildId){
    const conn = await BDDconnect(BDDname)
    await conn.query(`select * from users where guildMemberId = "${guildMemberId}" and guildId = ${guildId}`)
            .then(resp => conn.query(`update users set points = ${resp[0].points + points} where guildMemberId = ${guildMemberId} and guildId = ${guildId}`)).catch(err => console.error(err))
    if(conn){await conn.end()}
}

export async function getPoints(interaction){
    const conn = await BDDconnect(BDDname)
    const p = await conn.query(`select points from users where guildId = ${interaction.guild.id} and guildMemberId = ${interaction.member.id}`)
    if(conn){await conn.end()}
    return p[0].points
}

export async function getCotes(eventId){
    const conn = await BDDconnect(BDDname)
    const data = await conn.query(`select * from registry where eventId = "${eventId}"`)
    if(conn){await conn.end()}
    return getCotesFun(data)
}

export async function updateAnswerPoints(eventId, answer, points){
    const conn = await BDDconnect(BDDname)
    await conn.query(`select * from betanswers where eventId = "${eventId}" and ind = ${answer}`)
            .then(resp => conn.query(`update betanswers set points = ${resp[0].points + points} where eventId = "${eventId}" and ind = ${answer}`)).catch(err => console.error(err))
    if(conn){await conn.end()}
}

export async function getAnswerPoints(eventId, answer){
    const conn = await BDDconnect(BDDname)
    const p = await conn.query(`select points from betanswers where eventId = ${eventId} and ind = ${answer}`)
    if(conn){await conn.end()}
    return p[0].points
}