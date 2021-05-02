import { Message } from "@line/bot-sdk"

export const toTextMessage = (message: string): Message => {
    const textMessage: Message = {
        type: "text",
        text: message
    }
    return textMessage
}

export const toImageFromCrawler = (posts: string[][]): Message => {
    let columns = []
    for (const post of posts) {
        columns.push({
            imageUrl: post[0],
            action: {
                type: 'uri',
                label: post[1],
                uri: post[2]
            }
        })
    }
    const CarouselMessage: Message = {
        type: 'template',
        altText: 'This is a template message, check out on smartphone.',
        template: {
            type: 'image_carousel',
            columns: columns
        }
    }
    return CarouselMessage
}

export const toResultFromCrawler = (posts: string[][]): Message => {
    let columns = []
    for (const post of posts) {
        columns.push({
            title: post[0],
            text: post[1],
            actions: [{
                type: 'uri',
                label: '前往',
                uri: post[2]
            }]
        })
    }
    const CarouselMessage: Message = {
        type: 'template',
        altText: 'This is a template message, check out on smartphone.',
        template: {
            type: 'carousel',
            columns: columns
        }
    }
    return CarouselMessage
}

export const toStickerMessage = (): Message => {
    const stickerMessage: Message = {
        type: "sticker",
        packageId: "4",
        stickerId: "293"
    }

    return stickerMessage
}