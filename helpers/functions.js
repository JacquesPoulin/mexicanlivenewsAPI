// >> TESTER SI L'URL EST VALIDE
export function testUrl(url, base) {
	if (url.includes(base)) {
		return url;
	} else {
		return base + url;
	}
}

// >> TESTER SI L'ARTICLE NE CONTIENT PAS D'IMAGE
export function testText(title) {
	const newTitle = title.includes('<picture') || title.includes('<img')
	return newTitle == true ? (title = ' - MEXICAN NEWS (title with images) -') : title;
}
