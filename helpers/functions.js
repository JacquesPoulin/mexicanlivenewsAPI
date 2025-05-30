// >> TESTER SI L'URL EST VALIDE
export function testUrl(url, base) {
	// Ensure URL is a string before calling .includes() or concatenating
	if (typeof url !== 'string' || url.trim() === '') {
		return (typeof base === 'string' ? base : ''); // Return base if URL is not a string or empty
	}

	// Check if URL is already absolute
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return url;
	}

	// If URL includes base (e.g. /mexique/article and base is /mexique/) - this case might be tricky
	// For simplicity, if it's not absolute, assume it's relative to the base.
	// The original check `url.includes(base)` is problematic if base is 'http://site.com/news' and url is '/news/article'.
	// A more robust relative URL check might be needed, but for now, let's assume relative URLs need the base.

	// Ensure base ends with a slash if it doesn't have one and url doesn't start with one.
	let properBase = (typeof base === 'string' ? base : '');
	if (properBase && !properBase.endsWith('/') && !url.startsWith('/')) {
		properBase += '/';
	}
	// Remove leading slash from URL if base already ends with one, to avoid double slashes
	if (properBase.endsWith('/') && url.startsWith('/')) {
		url = url.substring(1);
	}

	return properBase + url;
}

// >> TESTER SI L'ARTICLE NE CONTIENT PAS D'IMAGE
export function testText(title) {
	const newTitle = title.includes('<picture') || title.includes('<img');
	return newTitle ? '[Image in title - Original title not displayed]' : title;
}
