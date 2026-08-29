import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const LOCKED_URL = 'https://minamiyamashiro-wakousai.pages.dev/';
const LOCKED_IMAGE = 'images/minamiyamashiro-wakousai-qr.png';
const LOCKED_SHA256 = '66818F4DE92FB8A1658C743C522686A1C608DA7FE0A37C9D3BA054597378C4E9';

const image = await readFile(LOCKED_IMAGE);
const actualHash = createHash('sha256').update(image).digest('hex').toUpperCase();

if (actualHash !== LOCKED_SHA256) {
  throw new Error(`固定QRコード画像が変更されています: ${actualHash}`);
}

const qrScript = await readFile('js/qr.js', 'utf8');
if (!qrScript.includes(LOCKED_URL) || !qrScript.includes(LOCKED_IMAGE)) {
  throw new Error('js/qr.jsの固定URLまたは固定画像パスが変更されています。');
}

const config = await readFile('js/config.js', 'utf8');
if (!config.includes(`PUBLIC_URL: '${LOCKED_URL}'`)) {
  throw new Error('js/config.jsの正式公開URLが変更されています。');
}

const page = await readFile('index.html', 'utf8');
if (!page.includes(`src="${LOCKED_IMAGE}"`) || page.includes('js/lib/qrcode.min.js')) {
  throw new Error('index.htmlの固定QRコード表示が変更されたか、動的生成ライブラリが再追加されています。');
}

console.log(`QR lock verified: ${LOCKED_URL}`);
console.log(`SHA-256: ${actualHash}`);
