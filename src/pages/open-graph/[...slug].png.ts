import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const docs = await getCollection('docs');

const pages = Object.fromEntries(
  docs.map(({ id, data }) => [id.replace(/\.mdx?$/, ''), { data }])
);

const route = await OGImageRoute({
  pages,
  param: 'slug',
  // The route file is `[...slug].png.ts`, so the URL extension is supplied
  // by the file name. Use the dict key as the slug (no extra `.png`).
  getSlug: (path) => path,
  getImageOptions: (_path: string, page: (typeof pages)[string]) => ({
    title: page.data.title,
    description: page.data.description ?? '',
    logo: {
      path: './public/og-image.svg',
      size: [80],
    },
    bgGradient: [
      [13, 9, 18],
      [42, 18, 51],
    ],
    border: { color: [127, 76, 195], width: 16, side: 'inline-start' },
    padding: 80,
    font: {
      title: {
        size: 72,
        lineHeight: 1.1,
        weight: 'Bold',
        color: [255, 255, 255],
      },
      description: {
        size: 32,
        lineHeight: 1.4,
        weight: 'Normal',
        color: [200, 200, 220],
      },
    },
    fonts: [
      'https://api.fontsource.org/v1/fonts/plus-jakarta-sans/latin-700-normal.ttf',
      'https://api.fontsource.org/v1/fonts/plus-jakarta-sans/latin-400-normal.ttf',
    ],
  }),
});

export const getStaticPaths = route.getStaticPaths;
export const GET = route.GET;
