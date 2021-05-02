// import * as firebase from 'firebase'
import * as fs from 'fs'
import * as ds from './dataStructure'
import { DirPath } from './chatbotConfig'

const date = new Date()
const pttPath = `${DirPath.ptt}/pttCls_${ date.getUTCMonth() + 1 }-${ date.getUTCDate() }.txt`
const costcoPath = `${DirPath.daybuy}/costco_${ date.getUTCMonth() + 1 }-${ date.getUTCDate() }.json`
const userPath = `${DirPath.user}/users.json`

const findDir = (path: string): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		fs.access(path, fs.constants.F_OK, (err) => {
			if (err) {
				reject(false)
			} else {
				resolve(true)
			}
		})
	})
}

const makeDir = async (path: string): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		fs.mkdir(path, (err) => {
			if (err) {
				reject(false)
			} else {
				resolve(true)
			}
		})
	})
}

const checkDir = async (path: string): Promise<boolean> => {
	let exist = false
	try {
		exist = await findDir(path)
		return exist
	} catch(error) {
		let dirs = path.split('/')
		dirs.pop()
		let prevDir = dirs.join('/')
		if (await checkDir(prevDir)) {
			return await makeDir(path)
		} else {
			return false
		}
	}
}

const saveFile = (path: string, content: string): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		fs.writeFile(path, content, (err) => {
			if (err) {
				console.error('Error from saveFile!')
				reject(false)
			} else {
				resolve(true)
			}
		})
	})
}

export const saveDbPttCls = async (Cls: string[]): Promise<void> => {
	if (await saveFile(pttPath, Cls.join('\n'))) {
		console.log('finished DbPttCls.')
	}
}

export const getDbPttCls = async (): Promise<string[]> => {
	let bds = []
	if (await findDir(pttPath)) {
		return new Promise((resolve, reject) => {
			fs.readFile(pttPath, (err, data) => {
				if (err) { reject(bds) }
				bds = String(data).split('\n').map((value, index, array) => { return value.split(',') })
				resolve(bds)
			})
		})
	} else {
		return Promise.reject(bds)
	}
}

export const getDbPttBds = async (): Promise<string[]> => {
	let cls = []
	try {
		cls = await getDbPttCls()
		cls = cls.filter((value) => { return value[0][1] == 'b' })
	} catch(e) {
		console.error('error getDbPttBds')
	}
	return cls
}

export const getDbPttAllData = (): void => {

	
}

export const saveDbDayBuyCostco = async (pts: string[]): Promise<void> => {
	if (await saveFile(costcoPath, JSON.stringify(pts))) {
		console.log('finished DbDayBuyCostco.')
	}
}

const checkUsersFile = async (): Promise<ds.dbUser[]> => {
	return new Promise((resolve, reject) => {
		fs.readFile(userPath, (error, text) => {
			if (error || text.length == 0) {
				console.error('Error from read file.')
				reject('Not found!')
			} else {
				let content: ds.dbUser[] = JSON.parse(text.toString())
				resolve(content)
			}
		})
	})
}

export const addDbUserKey = async (userId: string, keyword: string, board: string = 'ALLPOST'): Promise<string> => {
	let result = false
	let content: ds.dbUser[] = []
	try {
		content = await checkUsersFile()
	} catch(e) {
		console.log('Users file not found! Creating!')
		const keywordJSON: ds.dbUser = new ds.dbUser(userId, '', [new ds.follow(board, [keyword])])
		result = await saveFile(userPath, JSON.stringify([keywordJSON]))
		return result? keyword: '檔案出錯'
	}
	const userIndex = content.findIndex((value: ds.dbUser) => { return value.id == userId })
	if (userIndex >= 0) {
		const followIndex = content[userIndex].follows.findIndex((value: ds.follow) => { return value.board == board })
		if (followIndex >= 0) {
			if (content[userIndex].follows[followIndex].keywords.find((value, index, obj) => { return value == keyword }) == undefined) {
				content[userIndex].follows[followIndex].keywords.push(keyword)
			}
		} else {
			content[userIndex].follows.push(new ds.follow(board, [keyword]))
		}
	} else {
		const user: ds.dbUser = new ds.dbUser(userId, '', [new ds.follow(board, [keyword])])
		content.push(user)
	}
	result = await saveFile(userPath, JSON.stringify(content))
	return result? keyword: '檔案出錯'
}

export const getDbUser = async (userId: string = 'ALL'): Promise<ds.dbUser[]> => {
	try {
		let users = await checkUsersFile()
		if (userId != 'ALL') {
			const user: ds.dbUser[] = users.filter((value: ds.dbUser) => { return value.id == userId })
			return user
		} else {
			return users
		}
	} catch(error) {
		console.error('Users file not found!')
		return []
	}
}

export const initDir = async (): Promise<void> => {
	for(let path of Object.values(DirPath)) {
		try {
			await checkDir(path)
		} catch(err) {
			console.error(`error to found ${path}`)
		}
	}
}

export const testPtt = async (content: ds.pttPost[]): Promise<void> => {
	if (await saveFile('../data/ptt/ptsTest.json', JSON.stringify(content))) {
		console.log('save test file')
	}
}