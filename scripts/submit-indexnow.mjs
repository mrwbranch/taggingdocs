#!/usr/bin/env node
// Submit all sitemap URLs to IndexNow (Bing, Yandex, Naver, Seznam, Yep).
// Run after a deploy: `node scripts/submit-indexnow.mjs`
// IndexNow accepts up to 10,000 URLs per request.

const HOST = 'taggingdocs.com';
const KEY = '790d2bc6429408ecbb6912b236d6eece';
const SITEMAP = `https://${HOST}/sitemap-0.xml`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const xml = await (await fetch(SITEMAP)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`Found ${urls.length} URLs in sitemap.`);

const body = {
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList: urls,
};

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

console.log(`IndexNow response: ${res.status} ${res.statusText}`);
if (res.status === 200 || res.status === 202) {
  console.log('Submitted successfully.');
} else {
  console.error(await res.text());
  process.exit(1);
}
