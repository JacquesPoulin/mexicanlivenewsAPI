// >> PACKAGES
import express from 'express';
import cheerio from 'cheerio';
import axios from 'axios';

// >> DATAS
import newspapers from './data/newspapers.js';

// >> FUNCTIONS
import { testUrl, testText } from './helpers/functions.js';

// >> initializations
const PORT = process.env.PORT || 8000;
const app = express();

// Helper function to fetch and parse articles from a newspaper
async function fetchArticlesFromNewspaper(newspaperConfig) {
	const { base, address, language, name } = newspaperConfig;
	// Removed 'id' from destructuring as it's not used directly in this function's core logic,
	// 'name' is used for the source. If 'id' were needed, it would be part of newspaperConfig.

	try {
		const response = await axios.get(address);
		const html = response.data;
		const $ = cheerio.load(html);
		const articles = [];

		$('a:contains("Mexico")').each(function () {
			let title = $(this).text();
			let url = $(this).attr('href');

			const finalUrl = testUrl(url, base); // Ensure testUrl and testText are accessible
			const finalTexte = testText(title);

			articles.push({
				title: finalTexte,
				url: finalUrl,
				language: language,
				source: name, // Use name from newspaperConfig for the source
			});
		});
		return articles;
	} catch (error) {
		// Log the error or just rethrow to be handled by the caller
		// console.error(`Error fetching articles from ${name}:`, error);
		throw error; // Rethrow to allow caller to handle
	}
}

// ! >>> ROUTES <<<

// >> render api title
app.get('/', (req, res) => {
	res.json(`Bienvenue sur l'API d'infos sur le MEXIQUE !`);
});

// >> render api news
app.get('/news', async (req, res) => {
	let allArticles = [];
	try {
		const articlePromises = newspapers.map(newspaperConfig => {
			// Now, we call fetchArticlesFromNewspaper for each newspaper.
			// It returns a promise that resolves with articles or rejects with an error.
			return fetchArticlesFromNewspaper(newspaperConfig)
				.catch(error => {
					// Log error for this specific newspaper and return an empty array,
					// so Promise.allSettled can still proceed.
					console.error(`Error fetching articles for ${newspaperConfig.name}:`, error.message);
					return []; // Ensure failed fetches contribute an empty array
				});
		});

		const results = await Promise.allSettled(articlePromises);

		results.forEach(result => {
			// allSettled returns an object with status and value (if fulfilled) or reason (if rejected)
			// Since we are catching errors within the map and returning [],
			// we expect all promises passed to Promise.allSettled to effectively "fulfill"
			// from its perspective, with their value being an array of articles or an empty array.
			if (result.status === 'fulfilled' && result.value) {
				allArticles = allArticles.concat(result.value);
			}
			// If we didn't catch errors in the map, we'd check for result.status === 'rejected' here.
		});

		res.json(allArticles);
	} catch (error) {
		// This outer catch is for unexpected errors in the /news route setup itself.
		console.error('General error in /news route:', error);
		res.status(500).json({ error: 'Failed to fetch news from all sources' });
	}
});

// >> render a specific newspaper mexican news (id = newspaper.name)
app.get('/news/:id', async (req, res) => {
	try {
		// ? Requests
		const id = req.params.id;
		const newspaperConfig = newspapers.find(
			(paper) => paper.name === id
		);

		if (!newspaperConfig) {
			return res.status(404).json({ error: 'Newspaper not found' });
		}

		// Use the new fetchArticlesFromNewspaper function
		const specificArticles = await fetchArticlesFromNewspaper(newspaperConfig);
		// The 'language' and 'source' are correctly set by fetchArticlesFromNewspaper

		res.json(specificArticles);
	} catch (err) {
		// Log the specific error, which might come from fetchArticlesFromNewspaper
		console.error(`Error fetching articles for ${req.params.id}:`, err.message);
		// Send a 500 status code and a JSON error message
		res.status(500).json({ error: `Failed to fetch articles for ${req.params.id}` });
	}
});

// ! >>> EXPRESS PORT TESTING <<<
// Conditionally start the server only if the script is run directly
if (import.meta.url.startsWith('file://') && process.argv[1] === import.meta.filename) {
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

export default app; // Export app for testing purposes
