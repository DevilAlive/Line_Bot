const moduleName = "actionServices"

import { chatbot, Groups } from "./chatbotConfig"
import * as crawler from "./Crawler/crawler"
import * as lineServices from "./lineServices"
import * as lineMessages from "./lineMessages"

import * as db from './database'
import * as ds from './dataStructure'
import { follow } from "./dataStructure"

export const addKeyList = async (replyToken: string, userId: string, website: string, keyword: string): Promise<void> => {
    switch (website) {
        case 'ptt':
            let list = await db.addDbUserKey(userId, keyword)
            let message = `完成! ${list}`
            const lineMessage = lineMessages.toTextMessage(message)
            return lineServices.replyMessage(replyToken, lineMessage)
            break;
    
        default:
            break;
    }
}

export const getKeyList = async (replyToken: string, userId: string): Promise<void> => {
    try {
        const list = await db.getDbUser(userId)
        const message = list[0].follows.map((value: follow) => { return `在${value.board}看板尋找${value.keywords.join(', ')}` }).join('\n')
        const lineMessage = lineMessages.toTextMessage(message)
        return lineServices.replyMessage(replyToken, lineMessage)
    } catch(e) {
        console.error('error getKeyList')
    }
}

export const searchPTT = async (replyToken: string, keyword: string, board: string = 'ALLPOST'): Promise<void> => {
    const pts = await crawler.pttClawler(keyword, board)
    const content = pts.map((value: ds.pttPost) => {
        return [value.title, `推數:${value.heat==''? '0': value.heat}, 發文者:${value.author}, 版:${value.board}, 日期:${value.date}`, value.url]
    })
    const lineMessage = lineMessages.toResultFromCrawler(content)
    return lineServices.replyMessage(replyToken, lineMessage)
}

export const searchCostco = async (replyToken: string): Promise<void> => {
    const pts = await crawler.dayBuyClawler()
    const content = pts.map((value) => {
        let title = value.title
        if (title.substring(0, 9) == 'Costco好市多') { title = title.substring(9).trim() }
        if (title.length > 12) { title = title.substring(0, 12) }
        return [`https://${value.img}` , title, `https://${value.url}`]
    })
    // console.log(content)
    const lineMessage = lineMessages.toImageFromCrawler(content)
    return lineServices.replyMessage(replyToken, lineMessage)
}

export const message = (replyToken: string): Promise<any> => {
    const lineMessage = lineMessages.toStickerMessage()
    return lineServices.replyMessage(replyToken, lineMessage)
}

const errorMessage = (result: number): string => {
    let errorMessage: string
    switch (result) {
        case -1:
            errorMessage = "輸入錯誤"
            break
        case -2:
            errorMessage = "功能錯誤"
            break
        default:
            errorMessage = "未知錯誤"
            break
    }
    return errorMessage
}