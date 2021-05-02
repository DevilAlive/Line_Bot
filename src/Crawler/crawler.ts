import * as cheerio from 'cheerio'
import * as https from 'https'

import { PTT, DayBuy } from '../chatbotConfig'
import * as db from '../database'
import * as ds from '../dataStructure'
import { dbUser } from '../dataStructure'

const findPttPts = (body: CheerioStatic): any[] => {
	const posts = body('div.r-ent')
	let pts = []
	let prevPage = body('a.btn.wide').filter((index, element) => { return body(element).text().indexOf('上') >= 0 }).attr('href')
	for (let i = 0; i < posts.length; i++) {
		let href = posts.eq(i).find('div.title').children('a').attr('href')
		let title = posts.eq(i).find('div.title').children('a').text().trim()
		let nrec = posts.eq(i).find('div.nrec').children('span').text().trim()
		let author = posts.eq(i).find('div.meta').find('div.author').text().trim()
		let date = posts.eq(i).find('div.meta').find('div.date').text().trim()
		// You can find the way to search other posts which have same title or author in body('div.r-ent').
		pts.push(new ds.pttPost(title.split('(')[1].trim().slice(0, -1), title.split('(')[0].trim(), nrec, author, href, date))
	}
	return [prevPage, pts]
}

const findPttCls = (body: CheerioStatic): string[] => {
	const boards = body('a.board')
	let cls = []
	for (let i = 0; i < boards.length; i++) {
		cls.push([boards.eq(i).attr('href'), boards.eq(i).find('div.board-name').text(), boards.eq(i).find('div.board-class').text(), boards.eq(i).find('div.board-title').text().trim()])
	}
	return cls
}

const findCostcoNews = (body: CheerioStatic): ds.daybuyPost[] => {
	let col = []
	body('div.n5_htmk.cl').each((index, element) => {
		if (body(element).find('div.n5_htnrys.cl').length > 0) {
			const title = body(element).find('div.n5_htnrys.cl').find('div.n5_htnrwz.cl.mt10').find('p.n5_htnrjj.cl').children('a')
			const img = body(element).find('div.n5_htnrys.cl').find('div.n5_htnrtp.cl').children('a').first().children('img.imagelist')
			const date = body(element).find('div.n5_htmktb.cl').find('div.n5_mktbys.cl').children('span').last()
			col.push(new ds.daybuyPost(`${ DayBuy.host }/${ title.attr('href') }`, title.attr('title').trim(), title.text().trim().replace('\n', '(/n)'), `${ DayBuy.host }/${ img.attr('src') }`, date.text().trim()))
		}
	})
	return col
}

const findDaybuyCls = (body: CheerioStatic): string[] => {
	let page = []
	body('td.fl_g').each((index, element) => {
		body(element).find('a').each((i, e) => {
			const name = body(e).text().trim()
			if (name == 'Costco優惠懶人包'|| name == 'Costco賣場目擊情報') {
				page.push([body(element).find('a').attr('href'), name])
			}
		})
	})
	return page
}

const requester = (webSite : string, webStructure : https.RequestOptions): Promise<any[]> => {
	return new Promise((resolve, reject) => {
		https.get(webStructure, (res) => {
			let data = ''
			res.on('data', (chunk) => { data += chunk })
			res.on('end', () => {
				let num = []
				const body = cheerio.load(data)
				switch (webSite) {
					case 'findDaybuyCls':
						num = findDaybuyCls(body)
						break;
					case 'findCostcoNews':
						num = findCostcoNews(body)
						break;
					case 'findPttCls':
						num = findPttCls(body)
						break;
					case 'findPttPts':
						num = findPttPts(body)
						break;
					default:
						console.log('Wrong webSite.')
						break;
				}
				if (num.length > 0) {
					resolve(num)
				} else {
					reject([])
				}
			})
		})
	})
}

const findPttAllCls = async (webStructure : https.RequestOptions): Promise<string[]> => {
	let cls = []
	try {
		cls = await requester('findPttCls', webStructure)
	} catch(e) {
		console.error('Error from pttCls! ', e, `https://${webStructure.host + webStructure.path}`)
	}
	let finalCls = cls
	for (let cl of cls) {
		// make sure nextCls is not like '/bbs/*/', is like '/cls/*/', and * can't be 1.
		if (cl[0][1] == 'c' && cl[0] != '/cls/1') {
			const PTTnextCls: https.RequestOptions = { host: PTT.host, path: cl[0], headers: PTT.headers }
			try {
				const nextCls = await findPttAllCls(PTTnextCls)
				finalCls = finalCls.concat(nextCls)
			} catch(e) {
				console.error('Error from pttAllCls loop! ')
			}
		}
	}
	return finalCls
}

const findPttAllPts = async (board: string[], index: number = 0): Promise<ds.pttPost[]> => {
	let pts = []
	let prevPage = ''
	let prevDate = ''
	try {
		const pttBds = { host: PTT.host, path:board[0], headers:PTT.headers }
		let items = await requester('findPttPts', pttBds)
		prevPage = items.shift()
		items = items[0]
		prevDate = items[0].date
		pts = items.reverse()
	} catch(e) {
		console.error('Error from findPttAllPts! ')
	}
	try {
		const date = new Date()
		const yesterday = new Date(date)
		yesterday.setDate(date.getDate() - 1)
		const targetDay = new Date(Date.parse(`${date.getFullYear()}/${prevDate}`))
		if ((yesterday.valueOf() <= targetDay.valueOf()) || index == 0) {
			// limit for testing.
			if (index == 50) { console.log('\n'); return pts }
			process.stdout.write(`board: ${board[1]} page: ${index}\r`)
			let prevPts = await findPttAllPts([prevPage, board[1]], index + 1)
			pts = pts.concat(prevPts)
		} else {
			console.log(`board: ${board[1]} page: ${index}\n`)
		}
	} catch(e) {
		console.error(`Error from findPttAllPts! index: ${index} `)
	}
	return pts
}

const getPttBds = async (): Promise<string[][]> => {
	let bds = []
	try {
		console.log('start crawler to ptt.')
		bds = await db.getDbPttBds()
	} catch(e) {
		console.log(`Not found PttBds! Creating...`)
		try {
			const cls = await findPttAllCls(PTT)
			db.saveDbPttCls(cls)
			bds = cls.filter((value) => { return value[0][1] == 'b' })
		} catch(err) {
			console.error('Error from pttAllCls! ', err)
		}
	}
	return bds
}

const searchPttPts = async (board: string[], keyword: string): Promise<ds.pttPost[]> => {
	let pts: ds.pttPost[] = []
	try {
		pts = await findPttAllPts(board)
		// test posts array content
		// db.testPtt(pts.join('\n'))

		pts = pts.filter((value) => {
			return value.title.indexOf(keyword) >= 0
		}).map((value) => {
			value.url = 'https://' + PTT.host + value.url
			return value
		})
		// if (pts.length > 10) {
		// 	pts = pts.slice(0, 10)
		// }
	} catch(e) {
		console.error('Error from getPttPts! ')
	}
	return pts
}

const searchPttBds = (bds: string[][], board: string): string[][] => {
	let bd = []
	if (board != 'allBoard') {
		try {
			bd = bds.filter((value) => { return value[1] == board })
		} catch(e) {
			try{
				bd = bds.filter((value) => { return value[3].substring(2, 2 + board.length) == board })
			} catch(err) {
				console.log('Error from board not found')
			}
		}
	} else {
		bd = bds
	}
	return bd
}

export const pttClawler = async (keyword: string, board: string = 'ALLPOST'): Promise<ds.pttPost[]> => {
	let bds = await getPttBds()
	let bd = searchPttBds(bds, board)
	let pts: ds.pttPost[] = []
	if (bd.length >= 1) {
		for (let i = 0; i < bd.length; i++) {
			let result = await searchPttPts(bd[i], keyword)
			pts = pts.concat(result)
		}
	}
	db.testPtt(pts)
	if(pts.length > 10) {
		pts = pts.slice(0, 10)
	}
	return pts
}

export const dayBuyClawler = async (): Promise<ds.daybuyPost[]> => {
	let posts = []
	try {
		console.log('start crawler to daybuy.')
		const cls = await requester('findDaybuyCls', DayBuy)
		for (let cl of cls) {
			const costcoCls = {
				host: DayBuy.host,
				path: cl[0].split(DayBuy.host)[1]
			}
			try {
				const news = await requester('findCostcoNews', costcoCls)
				posts = posts.concat(news)
			} catch(e) {
				console.error('Error from costcoNews! ', e)
			}
		}
	} catch(e) {
		console.error('Error from daybuyCls! ', e)
	}

	db.saveDbDayBuyCostco(posts)

	posts = posts.sort((a, b) => { return Date.parse(a.date.substring(0, 15)).valueOf() < Date.parse(b.date.substring(0, 15)).valueOf() ? 1: -1 })
	if (posts.length > 10) {
		posts = posts.slice(0, 10)
	}
	return posts
}

const updateFollowed = async ():Promise<void> => {
	const list = await db.getDbUser()
	console.log(list)
	
}

export const autoCrawler = () => {
	setInterval(() => {
		updateFollowed()
	}, 10000)
}