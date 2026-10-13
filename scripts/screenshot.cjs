/**
 * README 截图生成脚本：伪造临时 admin 会话，对前台(:5000)与后台(:5900)各页面截图
 * 用法：node scripts/screenshot.cjs（需三个服务在跑：前台 5000 / 后台 5900 / API 3000）
 * 产物：Qnya-Frontend/docs/screenshots/*.png、Qnya-Backend/docs/screenshots/*.png
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright-core');
const { Client } = require('../../Qnya/node_modules/pg');
const Redis = require('../../Qnya/node_modules/ioredis');
const fastifyCookie = require('../../Qnya/node_modules/@fastify/cookie');

const CHROME = path.join(
  process.env.LOCALAPPDATA,
  'ms-playwright/chromium-1243/chrome-win64/chrome.exe'
);
const FRONT = 'http://localhost:5000';
const BACK = 'http://localhost:5900';

const readEnv = (key) => {
  const env = fs.readFileSync(path.join(__dirname, '../../Qnya/.env'), 'utf8');
  return env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim();
};

(async () => {
  // admin 会话（只读用户信息，不修改数据）
  const c = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'hzh12010',
    database: 'qnya'
  });
  await c.connect();
  const u = await c.query(
    "SELECT id, role FROM users WHERE email = '917944345@qq.com'"
  );
  const { id: userId, role } = u.rows[0];
  // 取一部有视频的番剧用于播放页截图
  const v = await c.query(
    'SELECT v.id, a.name FROM videos v JOIN anime a ON a.id = v.anime_id ORDER BY a.name LIMIT 1'
  );
  const videoId = v.rows[0].id;
  await c.end();

  // 临时会话：600s 后自动过期，结束时主动删除
  const secret = readEnv('SESSION_SECRET');
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const redis = new Redis('redis://localhost:6379');
  await redis.set(
    `session:${tokenHash}`,
    JSON.stringify({
      userId,
      email: '917944345@qq.com',
      status: true,
      role,
      expiresAt: Date.now() + 600_000
    }),
    'EX',
    600
  );
  const cookie = `session=${fastifyCookie.sign(token, secret)}`;
  const cleanup = async () => {
    await redis.del(`session:${tokenHash}`);
    await redis.quit();
    console.log('临时会话已清理');
  };

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true
  });
  const shot = async (page, url, file, waitMs = 2500) => {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(waitMs);
    await page.screenshot({ path: file });
    console.log('shot:', path.basename(file));
  };

  try {
    // ---------- 前台 ----------
    fs.mkdirSync('docs/screenshots', { recursive: true });
    const frontAnon = await browser.newContext({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 1.5
    });
    const fp0 = await frontAnon.newPage();
    await shot(fp0, `${FRONT}/login`, 'docs/screenshots/login.png');

    const frontCtx = await browser.newContext({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 1.5
    });
    await frontCtx.addCookies([
      { name: 'session', value: cookie.split('=')[1], url: FRONT }
    ]);
    const fp = await frontCtx.newPage();
    await shot(fp, `${FRONT}/`, 'docs/screenshots/home.png', 7000);
    await shot(fp, `${FRONT}/bangumi`, 'docs/screenshots/bangumi.png');
    await shot(fp, `${FRONT}/rank`, 'docs/screenshots/hot.png');
    await shot(fp, `${FRONT}/topic`, 'docs/screenshots/topic.png');
    await shot(fp, `${FRONT}/mine`, 'docs/screenshots/mine.png');
    await shot(fp, `${FRONT}/anime/${videoId}`, 'docs/screenshots/anime.png', 4500);
    await frontCtx.close();
    await frontAnon.close();

    // ---------- 后台 ----------
    const backDir = path.join(__dirname, '../../Qnya-Backend/docs/screenshots');
    fs.mkdirSync(backDir, { recursive: true });
    const backAnon = await browser.newContext({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 1.5
    });
    const bp0 = await backAnon.newPage();
    await shot(bp0, `${BACK}/login`, path.join(backDir, 'login.png'));

    const backCtx = await browser.newContext({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 1.5
    });
    await backCtx.addCookies([
      { name: 'session', value: cookie.split('=')[1], url: BACK }
    ]);
    const bp = await backCtx.newPage();
    await shot(bp, `${BACK}/`, path.join(backDir, 'dashboard.png'), 3500);
    await shot(bp, `${BACK}/anime`, path.join(backDir, 'anime.png'), 3500);
    await shot(bp, `${BACK}/users`, path.join(backDir, 'users.png'));
    await shot(bp, `${BACK}/scores`, path.join(backDir, 'scores.png'));
    await shot(bp, `${BACK}/topics`, path.join(backDir, 'topics.png'));
    await shot(bp, `${BACK}/recommend`, path.join(backDir, 'recommend.png'));
    await shot(bp, `${BACK}/feedbacks`, path.join(backDir, 'feedbacks.png'));
    await backCtx.close();
    await backAnon.close();
  } finally {
    await browser.close();
    await cleanup();
  }
  console.log('全部截图完成');
})();
