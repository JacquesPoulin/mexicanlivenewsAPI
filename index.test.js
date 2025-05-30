import { jest } from '@jest/globals';
import request from 'supertest';
import newspapersData from './data/newspapers.js';

// Configure the mock for 'axios' using jest.unstable_mockModule
// This should happen before any module (like our app) tries to import 'axios'
await jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(), // Provide a mock for the 'get' method
  },
}));

// Now, import axios. This will be the mocked version.
const axios = (await import('axios')).default;

// Declare app variable, it will be dynamically imported in beforeAll
let app;

// Get the first newspaper for testing valid /news/:id calls
const firstNewspaper = newspapersData[0];
const secondNewspaper = newspapersData[1] || newspapersData[0]; // Fallback if only one newspaper

describe('API Endpoints', () => {
  beforeAll(async () => {
    // Dynamically import the app *after* axios has been mocked and its handle obtained
    const appModule = await import('./index.js');
    app = appModule.default;
  });

  beforeEach(() => {
    // axios.get should now refer to the get mock from unstable_mockModule
    axios.get.mockReset();
  });

  describe('GET /', () => {
    it('should return 200 OK and the welcome message', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(`Bienvenue sur l'API d'infos sur le MEXIQUE !`);
    });
  });

  describe('GET /news/:id', () => {
    it('should return 404 Not Found for an invalid newspaper ID', async () => {
      const res = await request(app).get('/news/nonexistentid');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: 'Newspaper not found' });
    });

    it('should return 200 OK and articles for a valid newspaper ID', async () => {
      const mockHtml = `
        <html><body>
          <a href="/article1">Mexico is great</a>
          <a href="http://external.com/article2">Mexico is wonderful</a>
          <a>No link to Mexico here</a>
        </body></html>
      `;
      axios.get.mockResolvedValue({ data: mockHtml });

      const res = await request(app).get(`/news/${firstNewspaper.name}`);
      expect(res.statusCode).toEqual(200);
      expect(axios.get).toHaveBeenCalledWith(firstNewspaper.address);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3); // Adjusted for the <a> tag without href
      res.body.forEach(article => {
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('url');
        expect(article.source).toEqual(firstNewspaper.name);
        expect(article.language).toEqual(firstNewspaper.language);
        if (article.title === "Mexico is great") {
            expect(article.url).toEqual(firstNewspaper.base + "/article1");
        } else if (article.title === "Mexico is wonderful") {
            expect(article.url).toEqual("http://external.com/article2");
        } else if (article.title === "No link to Mexico here") {
            expect(article.url).toEqual(firstNewspaper.base); // Corrected testUrl returns base
        }
      });
    });

    it('should return 500 if axios fails for a valid newspaper ID', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));
      const res = await request(app).get(`/news/${firstNewspaper.name}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({ error: `Failed to fetch articles for ${firstNewspaper.name}` });
    });
  });

  describe('GET /news', () => {
    it('should return 200 OK and aggregated articles from all newspapers', async () => {
      axios.get.mockImplementation(url => {
        const paper = newspapersData.find(p => p.address === url);
        const paperName = paper ? paper.name : 'Unknown Source';
        const mockHtml = `<html><body><a href="/art-${paperName}">Mexico News from ${paperName}</a></body></html>`;
        return Promise.resolve({ data: mockHtml });
      });

      const res = await request(app).get('/news');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      newspapersData.forEach(paper => {
        expect(axios.get).toHaveBeenCalledWith(paper.address);
      });
      
      expect(res.body.length).toEqual(newspapersData.length);
      if (newspapersData.length > 0) {
        const articleSources = res.body.map(article => article.source);
        newspapersData.forEach(paper => {
          expect(articleSources).toContain(paper.name);
        });
      }
    });

    it('should return 200 OK and an empty array if all newspaper fetches fail', async () => {
      axios.get.mockImplementation(() => Promise.reject(new Error('Failed to fetch')));
      const res = await request(app).get('/news');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([]);
    });

     it('should return 200 OK with partial data if some newspaper fetches fail', async () => {
      const mockHtmlSuccess = `<html><body><a href="/artSuccess">Successful Mexico News</a></body></html>`;
      
      if (newspapersData.length < 2) {
        console.warn("Skipping partial success test for GET /news as less than 2 newspapers are configured.");
        return;
      }

      // Make the first call succeed and subsequent calls fail by default for this test
      let callCount = 0;
      axios.get.mockImplementation(url => {
        callCount++;
        if (callCount === 1 && url === newspapersData[0].address) {
          return Promise.resolve({ data: mockHtmlSuccess });
        }
        return Promise.reject(new Error('Failed to fetch for other newspaper'));
      });

      const res = await request(app).get('/news');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1); // Only one article from the successful fetch
      expect(res.body[0].source).toEqual(newspapersData[0].name);
      expect(res.body[0].title).toEqual("Successful Mexico News");
    });
  });
});
