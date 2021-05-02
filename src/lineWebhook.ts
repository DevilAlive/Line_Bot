const moduleName = "lineWebhook"

// import * as functions from 'firebase-functions'
import * as https from "https"
// import * as http from "http"

import { WebhookEvent, validateSignature } from "@line/bot-sdk"
import * as queryString from "query-string"

import { chatbot, LINE, OpenSSL, DNS, Groups } from "./chatbotConfig"
import * as actionServices from "./actionServices"
import * as lineServices from "./lineServices"
import * as lineMessages from "./lineMessages"

import * as fs from "fs"

const Options = {
    key : fs.readFileSync(OpenSSL.key),
    cert : fs.readFileSync(OpenSSL.cert)
}

export const chatbotWebhook = https.createServer(Options, (req, res) => {
    console.log(`Someone(ip:${ req.socket.remoteAddress }) Found The DNS.`)
    if (req.url == "/LineWebhook") {
        console.log("Someone Came LineWebhook.")
        const signature = req.headers["x-line-signature"] as string
        req.on('data', (chunk) => {
            if (validateSignature(chunk, LINE.channelSecret, signature)) {
                const events = JSON.parse(chunk as string).events as Array<WebhookEvent>
                for (const event of events)
                    eventDispatcher(event)
                res.statusCode = 200
            } else {
                const message = errorMessage(-1)
                console.log(message)
                res.statusCode = 403
                res.statusMessage = message
            }
        })
    } else {
        res.statusCode = 403
    }
    res.end()
    console.log("end")
}).listen(443, DNS, () => {
    console.log("Start webhook server!")
})

// // Use functions of firebase with GCP(Google Cloud Platform)
// export const chatbotWebhook = functions.https.onRequest((req, res) => {
//     const signature = req.headers["x-line-signature"] as string
//     if (validateSignature(req.rawBody, LINE.channelSecret, signature)) {
//         const events = req.body.events as Array<WebhookEvent>
//         for (const event of events)
//             eventDispatcher(event)
//         res.sendStatus(200)
//     } else {
//         const message = errorMessage(-1)
//         console.log(message)
//         res.status(403).send(message)
//     }
// })

const eventDispatcher = (event: WebhookEvent): void => {
    const userId = event.source.userId
    console.log(userId, event.timestamp, event.type)
    switch (event.type) {
        case "message":
            console.log("訊息類型：", event.message.type)
            switch (event.message.type) {
                case "text":
                    const intent = event.message.text
                    const timestamp = event.timestamp
                    messageDispatcher(userId, event.replyToken, intent, timestamp)
                    break
                case "sticker":
                        actionServices.message(event.replyToken)
                    break

                case "image":
                    break

                case "video":
                    break
                
                case "audio":
                    break

                case "location":
                    break

                case "file":
                    break

                default:
                    break
            }
            break
        case "postback":
            postbackDispatcher(userId, event.postback.data)
            break
        case "join":
            if (event.source.type == "group")
                console.log(event.source.groupId)
            break
        default:
            break
    }
}

export const messageDispatcher = (userId: string, replyToken: string, intent: string, timestamp: number): void => {
    let content = intent.split(':')
    switch (content[0]) {
        case '搜尋':
            if (content.length > 1) {
                const [keyword, board] = content[1].split(',')
                console.log(`search keyword: ${keyword} on board:${board}`)
                actionServices.searchPTT(replyToken, keyword.trim(), board)
            }
            break
        case '好市多':
            if (content.length > 1) {
                switch (content[1]) {
                    case '優惠':
                        
                        break
                    case '情報':

                        break
                    default:
                        break
                }
            } else {
                actionServices.searchCostco(replyToken)
            }
            break
        case '關注':
            if (content.length > 1){
                actionServices.addKeyList(replyToken, userId, content[1].split(',')[0], content[1].split(',')[1])
            } else {
                actionServices.getKeyList(replyToken, userId)
            }
            break
        case '最新':
        case '指令':
            lineServices.replyMessage(replyToken, lineMessages.toTextMessage('開發中'))
            break
            
        default:
            const lineMessage = lineMessages.toTextMessage(errorMessage(-2))
            lineServices.replyMessage(replyToken, lineMessage)
            break
    }
}

const postbackDispatcher = (userId: string, postbackData: string): void => {
    const postback = queryString.parse(postbackData);
    switch (postback.action) {
        // case "sendMessage":
        //     const sender = userId
        //     const receiver = postback.receiver as string
        //     actionServices.sendMessage(sender, receiver)
        //     break
    }
}

const errorMessage = (result: number): string => {
    let resultMessage
    switch (result) {
        case -1:
            resultMessage = "權限錯誤 我與Line中出了叛徒"
            break
        case -2:
            resultMessage = "抱歉 我不能理解你的指令"
            break
        case -3:
            resultMessage = "系統錯誤"
            break
        default:
            break
    }

    // const groupMessage = lineMessages.toTextMessage(`${chatbot} : ${moduleName} : ${resultMessage}`)
    // const groupId = Groups.filter(group => { return group.name == "system group" })[0].lineId
    // lineServices.pushMessage(groupId, groupMessage)
    return resultMessage
}