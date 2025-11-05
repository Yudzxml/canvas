const JavaScriptObfuscator = require('javascript-obfuscator');
const axios = require('axios');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const FormData = require('form-data');

function isReadableStream(x) {
  return x && typeof x.pipe === 'function' && typeof x.readable !== 'undefined';
}

function sanitizeFilename(name = 'file.js') {
  return path.basename(String(name)).replace(/\s+/g, '_') || 'file.js';
}

async function ofuscateFromUrl(url, level = 'medium') {
  if (!url || typeof url !== 'string') {
    throw new TypeError('Parameter `url` must be a non-empty string.');
  }

  const levels = ['low', 'medium', 'hard', 'extreme'];
  if (!levels.includes(level)) {
    throw new TypeError("`level` must be one of: 'low', 'medium', 'hard', 'extreme'.");
  }

  const presets = {
    low: {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      debugProtection: false,
      // debugProtectionInterval OMITTED when debugProtection === false
      disableConsoleOutput: false,
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false,
      rotateStringArray: true,
      stringArray: true,
      stringArrayEncoding: ['none'],
      stringArrayThreshold: 0.4
    },
    medium: {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
      debugProtection: false,
      // debugProtectionInterval OMITTED when debugProtection === false
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false,
      rotateStringArray: true,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75
    },
    hard: {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 1,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.9,
      debugProtection: true,
      debugProtectionInterval: 1000, // number >= 0
      disableConsoleOutput: true,
      identifierNamesGenerator: 'mangled',
      renameGlobals: true,
      rotateStringArray: true,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 1,
      transformObjectKeys: true,
      unicodeEscapeSequence: true
    },
    extreme: {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 1,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 1,
      debugProtection: true,
      debugProtectionInterval: 1000, // number >= 0
      disableConsoleOutput: true,
      identifierNamesGenerator: 'mangled',
      renameGlobals: true,
      rotateStringArray: true,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 1,
      transformObjectKeys: true,
      unicodeEscapeSequence: true,
      simplify: false,
      target: 'browser',
      reservedNames: [],
      domainLock: []
    }
  };

  const obfuscatorOptions = Object.assign({}, presets[level]);

  // Safety: ensure debugProtectionInterval is valid only if debugProtection is true
  if (obfuscatorOptions.debugProtection) {
    // If user omitted interval, give sensible default
    if (typeof obfuscatorOptions.debugProtectionInterval === 'undefined' || obfuscatorOptions.debugProtectionInterval === null) {
      obfuscatorOptions.debugProtectionInterval = 1000;
    }
    // coerce to integer and validate
    const dpi = Number(obfuscatorOptions.debugProtectionInterval);
    if (!Number.isFinite(dpi) || Number.isNaN(dpi) || dpi < 0) {
      throw new Error('Invalid obfuscator option: debugProtectionInterval must be a number >= 0 when debugProtection is enabled.');
    }
    obfuscatorOptions.debugProtectionInterval = Math.floor(dpi);
  } else {
    // Remove property entirely to avoid validator complaints
    delete obfuscatorOptions.debugProtectionInterval;
  }

  let response;
  try {
    response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 5 * 1024 * 1024,
      headers: { 'User-Agent': 'ofuscator/1.0' }
    });
  } catch (err) {
    if (err.response) {
      throw new Error(`Failed to fetch URL (status: ${err.response.status})`);
    } else if (err.code === 'ECONNABORTED') {
      throw new Error('Failed to fetch URL (timeout)');
    } else if (err.message && err.message.includes('maxContentLength')) {
      throw new Error('Fetched content too large');
    }
    throw new Error(`Failed to fetch URL (${err.message || String(err)})`);
  }

  let sourceCode;
  try {
    sourceCode = Buffer.from(response.data).toString('utf8');
  } catch (e) {
    throw new Error('Fetched content could not be decoded as UTF-8.');
  }

  if (!sourceCode || typeof sourceCode !== 'string' || sourceCode.trim().length === 0) {
    throw new Error('Fetched content is empty or not textual JS.');
  }

  const snippet = sourceCode.substring(0, 2000);
  const looksLikeJS = /\b(function|=>|var |let |const |class |import |export |require\(|module\.exports)\b/.test(snippet);
  if (!looksLikeJS) {
    const ct = (response.headers && (response.headers['content-type'] || response.headers['Content-Type'])) || '';
    if (!/javascript|text\/plain|application\/x-javascript|application\/javascript/.test(ct)) {
      throw new Error('Fetched content does not appear to be JavaScript.');
    }
  }

  let obfuscationResult;
  try {
    obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, obfuscatorOptions);
  } catch (err) {
    throw new Error(`Obfuscation failed: ${err && err.message ? err.message : String(err)}`);
  }

  const obfuscatedCode = obfuscationResult.getObfuscatedCode();
  return { code: obfuscatedCode };
}

async function YudzCdnV2(input, filename = 'file.js') {
  const form = new FormData();
  const safeName = sanitizeFilename(filename);

  try {
    if (typeof input === 'string') {
      try {
        await fsp.access(input, fs.constants.R_OK);
        const stream = fs.createReadStream(input);
        form.append('file', stream, { filename: path.basename(input) });
      } catch {
        const buffer = Buffer.from(input, 'utf8');
        form.append('file', buffer, { filename: safeName });
      }
    } else if (Buffer.isBuffer(input)) {
      form.append('file', input, { filename: safeName });
    } else if (isReadableStream(input)) {
      form.append('file', input, { filename: safeName });
    } else {
      throw new Error('Unsupported input for upload. Provide file path, Buffer, stream, or raw string.');
    }

    const headers = Object.assign({}, form.getHeaders());

    const resp = await axios.post('https://apiku.x-server.my.id/api/v2/upload', form, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000
    });

    if (resp && resp.data) {
      const data = resp.data;
      if (data.success === true || data.success === 'true') {
        return data.result && data.result.url ? data.result.url : data.url || data.result;
      }
      if (resp.status >= 200 && resp.status < 300 && (typeof data === 'string' || data.url)) {
        return data.url || data;
      }
      throw new Error(data.message || `Upload failed (status ${resp.status})`);
    }
    throw new Error('Upload failed: empty response from server');
  } catch (err) {
    throw new Error(`Upload gagal: ${err && err.message ? err.message : String(err)}`);
  }
}

module.exports = {
  ofuscateFromUrl,
  YudzCdnV2
};