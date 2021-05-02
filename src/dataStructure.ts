
export interface dbUser{
    id: string
    name: string
    follows: Array<follow>
}

export interface follow{
    board: string
    keywords: Array<string>
}

export interface pttBoard{
	url: string
	title: string
	name: string
	text: string
}

export interface pttPost{
	board: string
	title: string
	heat: string
	author: string
	url: string
	date: string
}

export interface daybuyPost{
	url: string
	title: string
	text: string
	img: string
	date: string
}

export class dbUser implements dbUser {
	constructor(id: string, name: string, follow: follow[]) {
		this.id = id
		this.name = name
		this.follows = follow
	}
}

export class follow implements follow {
	constructor(board: string, keywords: string[]) {
		this.board = board
		this.keywords = keywords
	}
}

export class pttPost implements pttPost {
	constructor(board: string, title: string, heat: string, author: string, url: string, date: string) {
		this.board = board
		this.title = title
		this.heat = heat
		this.author = author
		this.url = url
		this.date = date
	}
}

export class daybuyPost implements daybuyPost {
	constructor(url: string, title: string, text: string, img: string, date: string) {
		this.url = url
		this.title = title
		this.text = text
		this.img = img
		this.date = date
	}
}
