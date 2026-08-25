const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateAndroidAssets() {
  const iconPath = path.resolve(__dirname, '../public/icon.png');
  const resDir = path.resolve(__dirname, '../android/app/src/main/res');

  if (!fs.existsSync(iconPath)) {
    console.error('public/icon.png not found!');
    return;
  }

  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  for (const mm of mipmaps) {
    const targetDir = path.join(resDir, mm.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // ic_launcher.png
    await sharp(iconPath)
      .resize(mm.size, mm.size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // ic_launcher_round.png
    await sharp(iconPath)
      .resize(mm.size, mm.size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png
    await sharp(iconPath)
      .resize(Math.round(mm.size * 0.8), Math.round(mm.size * 0.8))
      .extend({
        top: Math.round(mm.size * 0.1),
        bottom: Math.round(mm.size * 0.1),
        left: Math.round(mm.size * 0.1),
        right: Math.round(mm.size * 0.1),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Generated mipmap ${mm.dir} (${mm.size}x${mm.size})`);
  }

  // Generate splash images for drawables
  const drawables = [
    { dir: 'drawable', w: 480, h: 800 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
  ];

  for (const dr of drawables) {
    const targetDir = path.join(resDir, dr.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // Generate splash screen with dark background and centered logo
    const logoSize = Math.min(Math.round(Math.min(dr.w, dr.h) * 0.4), 400);
    const logoBuf = await sharp(iconPath)
      .resize(logoSize, logoSize)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: dr.w,
        height: dr.h,
        channels: 4,
        background: { r: 5, g: 7, b: 9, alpha: 1 }
      }
    })
      .composite([{
        input: logoBuf,
        gravity: 'center'
      }])
      .png()
      .toFile(path.join(targetDir, 'splash.png'));

    console.log(`Generated splash for ${dr.dir} (${dr.w}x${dr.h})`);
  }

  console.log('✅ Android mipmap and splash resources generated successfully!');
}

generateAndroidAssets().catch(err => {
  console.error('Asset generation error:', err);
  process.exit(1);
});
