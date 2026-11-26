import { createAppleSplashScreens, defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0.06 },
    maskable: { ...minimal2023Preset.maskable, padding: 0.3, resizeOptions: { background: '#151515' } },
    apple: { ...minimal2023Preset.apple, padding: 0.18, resizeOptions: { background: '#151515' } },
    appleSplashScreens: createAppleSplashScreens(
      {
        padding: 0.42,
        resizeOptions: { background: '#151515', fit: 'contain' },
        darkResizeOptions: { background: '#151515', fit: 'contain' },
        linkMediaOptions: { log: true, addMediaScreen: true, basePath: '/', xhtml: false },
        png: { compressionLevel: 9, quality: 70 },
        name: (landscape, size, dark) => `splash/${landscape ? 'l' : 'p'}-${size.width}x${size.height}${dark ? '-dark' : ''}.png`,
      },
      [
        'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
        'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 14 Plus', 'iPhone 14',
        'iPhone 13 mini', 'iPhone SE 4.7"',
      ],
    ),
  },
  images: ['public/icon-source.svg'],
});
