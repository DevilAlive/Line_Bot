import * as lineWebhook from "./lineWebhook"
import * as crawler from './Crawler/crawler'
import { initDir, addDbUserKey } from './database'
export const init = initDir()
export const chatbotWebhook = lineWebhook.chatbotWebhook
// export const autoCrawler = crawler.autoCrawler