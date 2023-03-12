// >> PACKAGES
import express from 'express';
import cheerio from 'cheerio';
import axios from 'axios';

// >> DATAS
import newspapers from './data/newspapers.js';

// >> FUNCTIONS
import { testUrl, testText } from './helpers/functions.js';
import addressError from './helpers/errors.js';

// >> initializations
const PORT = process.env.PORT || 8000;
const app = express();

// ? render all api articles
const articles = [];
newspapers.forEach((newspaper) => {
	const base = newspaper.base;

	axios.get(newspaper.address).then((response) => {
		const html = response.data;
		const $ = cheerio.load(html);

		$('a:contains("Mexico")', html).each(function () {
			let title = $(this).text();
			let url = $(this).attr('href');

			const finalUrl = testUrl(url, base);
			const finalTexte = testText(title);

			articles.push({
				title: finalTexte,
				url: finalUrl,
				language: newspaper.language,
				source: newspaper.name,
			});
		});
	});
});

// ! >>> ROUTES <<<

// >> render api title
app.get('/', (req, res) => {
	test = res.json(`Bienvenue sur l'API d'infos sur le MEXIQUE !`);
});

// >> render api news
app.get('/news', (req, res) => {
	res.json(articles);
});

// >> render a specific newspaper mexican news (id = newspaper.name)
app.get('/news/:id', async (req, res) => {
	try {
		// ? Requests
		const id = req.params.id;
		const newspaperAdress = newspapers.filter(
			(newspaper) => newspaper.name === id
		)[0].address;
		const base = newspapers.filter((newspaper) => newspaper.name === id)[0]
			.base;

		const response = await axios.get(newspaperAdress, base);
		const html = response.data;
		const $ = cheerio.load(html);

		const specificArticles = [];

		$('a:contains("Mexico")', html).each(function () {
			let title = $(this).text();
			let url = $(this).attr('href');

			// ? URLs & TEXTs TESTING
			const finalUrl = testUrl(url, base);
			const finalTexte = testText(title);

			specificArticles.push({
				title: finalTexte,
				url: finalUrl,
				language: newspaper.language,
				source: id,
			});
		});

		res.json(specificArticles);
	} catch (err) {
		console.log(err);
		res.json(addressError);
	}
});

// ! >>> EXPRESS PORT TESTING <<<
app.listen(PORT, () => {
	console.log(`Server listening on ${PORT}`);
});
