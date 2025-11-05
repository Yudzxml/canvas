// server.js
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const fsp = fs.promises;
const { deobfuscateInput } = require('./lib/deobfuscate');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { generateImage, smeme } = require('./lib/createWelcomeXsmeme'); 
const { ofuscateFromUrl, YudzCdnV2 } = require('./lib/obfuscate'); 

const app = express();

app.get("/welcomev1", async (req, res) => {
  try {
    const { generateWelcomeImageFromURL } = require("./lib/welcomev1");
    const {
      username,
      guildName,
      guildIcon,
      memberCount,
      avatar,
      background,
      quality = 90,
    } = req.query;

    // Validasi parameter
    if (!username || !guildName || !memberCount || !avatar || !background || !guildIcon) {
      return res.status(400).json({
        success: false,
        error:
          "Parameter username, guildName, guildIcon, memberCount, avatar, dan background wajib diisi.",
      });
    }

    // Generate gambar
    const buffer = await generateWelcomeImageFromURL(
      username,
      guildName,
      guildIcon,
      memberCount,
      avatar,
      background,
      quality
    );

    // Kirim hasil buffer
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("❌ Gagal generate gambar:", err);
    res.status(500).json({
      success: false,
      error: "Terjadi kesalahan saat membuat gambar welcome.",
    });
  }
});

app.get('/welcomev2', async (req, res) => {
  try {
    const { generateWelcomeV2ImageFromURL } = require('./lib/welcomev2');
    const { username, guildName, memberCount, avatar, background } = req.query;

    if (!username || !guildName || !memberCount || !avatar || !background) {
      return res.status(400).json({
        success: false,
        error: 'Parameter username, guildName, memberCount, avatar, dan background wajib diisi.'
      });
    }

    const buffer = await generateWelcomeV2ImageFromURL(
      username,
      guildName,
      memberCount,
      avatar,
      background
    );

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Gagal generate gambar.' });
  }
});

app.get('/welcomev3', async (req, res) => {
  try {
    const { generateWelcomeImageV4FromURL } = require('./lib/welcomev3');
    const { avatar, background, description } = req.query;

    if (!avatar || !background || !description) {
      return res.status(400).json({
        success: false,
        error: 'Parameter avatar, background, dan description wajib diisi.'
      });
    }

    const buffer = await generateWelcomeImageV4FromURL(
      avatar,
      background,
      description
    );

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Gagal generate gambar.' });
  }
});

app.get('/welcomev4', async (req, res) => {
  try {
    const { generateWelcomeV5ImageFromURL } = require('./lib/welcomev5');
    const { username, guildName, memberCount, avatar, background, quality } = req.query;

    // ✅ Cek parameter wajib
    if (!username || !guildName || !memberCount || !avatar || !background) {
      return res.status(400).json({
        success: false,
        error: 'Parameter username, guildName, memberCount, avatar, dan background wajib diisi.'
      });
    }

    // ✅ Konversi quality ke angka (default 80%)
    const imageQuality = quality ? parseInt(quality) : 80;

    // ✅ Generate buffer dari fungsi
    const buffer = await generateWelcomeV5ImageFromURL(
      username,
      guildName,
      parseInt(memberCount),
      avatar,
      background,
      imageQuality
    );

    // ✅ Kirim buffer langsung sebagai JPEG
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (err) {
    console.error('❌ Error generate image:', err);
    res.status(500).json({ success: false, error: 'Gagal generate gambar.' });
  }
});

app.get("/goodbyev1", async (req, res) => {
  try {
    const { generateGoodbyeImage } = require("./lib/goodbyev1"); // sesuaikan path file JS-nya
    const {
      username,
      guildName,
      guildIcon,
      memberCount,
      avatar,
      background,
      quality = 90,
    } = req.query;

    // Validasi parameter
    if (!username || !guildName || !memberCount || !avatar || !background || !guildIcon) {
      return res.status(400).json({
        success: false,
        error:
          "Parameter username, guildName, guildIcon, memberCount, avatar, dan background wajib diisi.",
      });
    }

    // Generate gambar Goodbye
    const buffer = await generateGoodbyeImage(
      username,
      guildName,
      guildIcon,
      Number(memberCount),
      avatar,
      background,
      Number(quality)
    );

    // Kirim hasil buffer sebagai gambar JPEG
    res.setHeader("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch (err) {
    console.error("❌ Gagal generate gambar goodbye:", err);
    res.status(500).json({
      success: false,
      error: "Terjadi kesalahan saat membuat gambar goodbye.",
    });
  }
});

app.get("/goodbyev2", async (req, res) => {
  try {
    const { generateGoodbyeImage } = require("./lib/goodbyev2"); // sesuaikan path file JS-nya
    const {
      username,
      guildName,
      memberCount,
      avatar,
      background,
    } = req.query;

    // Validasi parameter
    if (!username || !guildName || !memberCount || !avatar || !background) {
      return res.status(400).json({
        success: false,
        error:
          "Parameter username, guildName, memberCount, avatar, dan background wajib diisi.",
      });
    }

    // Generate gambar Goodbye V2
    const buffer = await generateGoodbyeImage(
      username,
      guildName,
      Number(memberCount),
      avatar,
      background
    );

    // Kirim hasil buffer sebagai gambar PNG
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("❌ Gagal generate gambar goodbye v2:", err);
    res.status(500).json({
      success: false,
      error: "Terjadi kesalahan saat membuat gambar goodbye v2.",
    });
  }
});

app.get("/goodbyev3", async (req, res) => {
  try {
    const {
      generateGoodbyeImageFromUrl
    } = require("./lib/goodbyev3");
    const {
      avatar,
      background,
      description
    } = req.query;

    // Validasi parameter
    if (!avatar || !background || !description) {
      return res.status(400).json({
        success: false,
        error:
          "Parameter avatar, background, dan description wajib diisi.",
      });
    }

    // Generate gambar Goodbye V3 via URL
    const buffer = await generateGoodbyeImageFromUrl(avatar, background, description);

    // Kirim hasil buffer sebagai gambar PNG
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error("❌ Gagal generate gambar goodbye v3:", err);
    res.status(500).json({
      success: false,
      error: "Terjadi kesalahan saat membuat gambar goodbye v3.",
    });
  }
});

app.get("/goodbyev4", async (req, res) => {
  try {
    const { generateGoodbyeImageFromUrl } = require("./lib/goodbyev4");
    const { username, guildName, memberCount, avatar, background, quality } = req.query;

    // Validasi parameter
    if (!username || !guildName || !memberCount || !avatar || !background) {
      return res.status(400).json({
        success: false,
        error: "Parameter username, guildName, memberCount, avatar, dan background wajib diisi.",
      });
    }

    // Pastikan memberCount dan quality adalah number
    const memberCountNum = parseInt(memberCount, 10);
    const qualityNum = quality ? parseInt(quality, 10) : 80;

    if (isNaN(memberCountNum) || isNaN(qualityNum)) {
      return res.status(400).json({
        success: false,
        error: "Parameter memberCount dan quality harus berupa angka.",
      });
    }

    // Generate gambar Goodbye V4 via URL
    const buffer = await generateGoodbyeImageFromUrl(
      username,
      guildName,
      memberCountNum,
      avatar,
      background,
      qualityNum
    );

    // Kirim hasil buffer sebagai gambar JPEG
    res.setHeader("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch (err) {
    console.error("❌ Gagal generate gambar goodbye v4:", err);
    res.status(500).json({
      success: false,
      error: "Terjadi kesalahan saat membuat gambar goodbye v4.",
    });
  }
});

// ===== API ENDPOINT: PROFILE =====
app.get('/profile', async (req, res) => {
  try {
    const { createProfileCard } = require('./lib/createProfile');

    const requiredParams = [
      'nama',
      'id',
      'status',
      'limit',
      'role',
      'level',
      'level_cache',
      'profilePicUrl',
      'backgroundUrl'
    ];

    // Cek apakah semua parameter dikirim
    const missing = requiredParams.filter(param => !req.query[param]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Parameter wajib hilang: ${missing.join(', ')}`
      });
    }

    // Semua parameter ada → buat data
    const userData = {  
  nama: req.query.nama,  
  id: req.query.id,  
  status: req.query.status,  
  limit: req.query.limit,  
  role: req.query.role,  
  level: req.query.level,  
  level_cache: Number(req.query.level_cache),  
  profilePicUrl: decodeURIComponent(req.query.profilePicUrl),  
  backgroundUrl: decodeURIComponent(req.query.backgroundUrl)  
};

    // Buat gambar profil
    const buffer = await createProfileCard(userData);

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Gagal generate image',
      error: err.message
    });
  }
});

// ===== API ENDPOINT: WELCOME IMAGE =====
app.get('/welcome', async (req, res) => {
  try {
    const { name, pp, iwelcome } = req.query;

    if (!name || !pp || !iwelcome) {
      return res.status(400).send('Parameter name, pp, dan iwelcome wajib diisi');
    }

    const buffer = await generateImage(name, pp, iwelcome);
    if (!buffer) return res.status(500).send('Gagal generate image');

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan server');
  }
});

// ===== API ENDPOINT: SMEME =====
app.get('/smeme', async (req, res) => {
  try {
    const { text, text2, pp } = req.query;

    if (!pp) return res.status(400).send('Parameter pp wajib diisi');

    const result = await smeme(text, text2, pp);

    if (result.status !== 200) return res.status(result.status).send(result.message);

    res.json(result.result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan server');
  }
});

// ===== API ENDPOINT: ENC =====
app.get('/obfuscate', async (req, res) => {
  const url = req.query.url;
  const level = (req.query.level || 'medium').toLowerCase();
  const allowed = ['low', 'medium', 'hard', 'extreme'];

  if (!url) {
    return res.status(400).json({ success: false, error: 'Query parameter `url` is required.' });
  }
  if (!allowed.includes(level)) {
    return res.status(400).json({ success: false, error: '`level` must be one of: low, medium, hard, extreme.' });
  }

  try {
    const result = await ofuscateFromUrl(url, level);
    if (!result || !result.code) {
      return res.status(500).json({ success: false, error: 'Obfuscation returned empty result.' });
    }

    const obfCode = result.code;
    const uploadResult = await YudzCdnV2(obfCode, 'obfuscated.js');

    if (uploadResult && typeof uploadResult === 'object' && uploadResult.error) {
      return res.status(502).json({ success: false, error: 'Upload gagal', detail: uploadResult.error });
    }

    return res.json({
      level,
      source: url,
      obfuscatedSize: Buffer.byteLength(obfCode, 'utf8'),
      cdnUrl: uploadResult
    });
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    return res.status(500).json({ success: false, error: 'Internal server error', detail: msg });
  }
});

// ===== API ENDPOINT: NO ENC =====
app.get('/deobfuscate', async (req, res) => {
  const { url, options } = req.query;

  if (!url) return sendJson(res, 400, { success: false, error: 'Missing url query parameter' });

  let parsedOptions = {};
  if (options) {
    try {
      parsedOptions = JSON.parse(options);
    } catch (e) {
      return sendJson(res, 400, { success: false, error: 'options must be valid JSON' });
    }
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return sendJson(res, 400, { success: false, error: 'URL must use http or https' });
    }
  } catch (e) {
    return sendJson(res, 400, { success: false, error: 'Invalid url' });
  }

  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, `yudz_tmp_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);

  try {
    const resp = await axios.get(url, { responseType: 'text', timeout: 30000 });
    const codeText = String(resp.data || '');
    await fsp.writeFile(tmpPath, codeText, 'utf8');

    const result = await deobfuscateInput({ filepath: tmpPath, output: null, options: parsedOptions });

    if (!result) {
      await fsp.unlink(tmpPath).catch(() => {});
      return sendJson(res, 500, { success: false, error: 'Empty result from deobfuscate' });
    }
    if (typeof result === 'object' && result.error) {
      await fsp.unlink(tmpPath).catch(() => {});
      return sendJson(res, 500, { success: false, error: String(result.error) });
    }

    await fsp.unlink(tmpPath).catch(() => {});
    return sendJson(res, 200, { success: true, result: result });
  } catch (err) {
    await fsp.unlink(tmpPath).catch(() => {});
    return sendJson(res, 500, { success: false, error: err && err.message ? err.message : String(err) });
  }
});


function sendJson(res, status = 200, payload = {}) {
  res.status(status).json(payload);
}

// ===== START SERVER =====
const PORT = process.env.PORT || 13217;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));

