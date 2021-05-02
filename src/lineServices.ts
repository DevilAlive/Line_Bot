import { Client, Message } from "@line/bot-sdk"
import { LINE } from "./chatbotConfig"

const lineClient = new Client(LINE)

export const getName = async (userId: string): Promise<string> => {
    try {
        const profile = await lineClient.getProfile(userId)
        return profile.displayName
    } catch (error) {
        console.error("lineClient.getProfile 出錯拉")
        return error
    }
}

export const replyMessage = async (replyToken: string, lineMessage: Message | Message[]): Promise<void> => {
    try {
        await lineClient.replyMessage(replyToken, lineMessage)
        console.log("lineClient.replyMessage 完成發送")
    } catch (err) {
        console.error("lineClient.replyMessage 出錯拉")
        return err
    }
    // return 'lineClient.replyMessage 完成發送'
}

export const pushMessage = async (userId: string, lineMessage: Message | Message[]): Promise<void> => {
    try {
        await lineClient.pushMessage(userId, lineMessage)
        console.log("lineClient.pushMessage 完成發送")
    } catch(err) {
        console.error("lineClient.pushMessage 出錯拉")
        return err
    }
    // return 'lineClient.pushMessage 完成發送'
}
