const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const os = require('os');
const { deobfuscate } = require('js-deobfuscator');

const fsp = fs.promises;

function sendJson(res, status = 200, payload = {}) {
  res.status(status).json(payload);
}

const DEFAULT_OPTIONS = {
  verbose: false,
  isModule: false,
  arrays: { unpackArrays: true, removeArrays: true },
  proxyFunctions: { replaceProxyFunctions: true, removeProxyFunctions: true },
  expressions: { simplifyExpressions: true, removeDeadBranches: true },
  miscellaneous: { beautify: true, simplifyProperties: true, renameHexIdentifiers: true }
};

async function YudzCdnV2(input, filename = 'file.js') {
  const form = new FormData();

  try {
    if (typeof input === 'string') {
      try {
        await fsp.access(input);
        form.append('file', fs.createReadStream(input), path.basename(input));
      } catch {
        const buffer = Buffer.from(input, 'utf8');
        form.append('file', buffer, { filename });
      }
    } else if (Buffer.isBuffer(input)) {
      form.append('file', input, { filename });
    } else if (input && typeof input.pipe === 'function') {
      form.append('file', input, { filename });
    } else {
      throw new Error('Unsupported input for upload');
    }

    const response = await axios.post('https://apiku.x-server.my.id/api/v2/upload', form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000
    });

    if (response.data && (response.data.success === true || response.data.success === 'true')) {
      return response.data.result.url;
    } else {
      throw new Error(response.data?.message || 'Upload failed');
    }
  } catch (err) {
    return { error: `Upload gagal: ${err.message}` };
  }
}

async function deobfuscateInput({ filepath = null, text = null, output = null, options = {} } = {}) {
  if (!filepath && !text) throw new Error('Harus memberikan filepath atau text sebagai input.');

  const inputCode = filepath ? await fsp.readFile(filepath, 'utf8') : text;

  const cfg = {
    ...DEFAULT_OPTIONS,
    ...options,
    arrays: { ...DEFAULT_OPTIONS.arrays, ...(options.arrays || {}) },
    proxyFunctions: { ...DEFAULT_OPTIONS.proxyFunctions, ...(options.proxyFunctions || {}) },
    expressions: { ...DEFAULT_OPTIONS.expressions, ...(options.expressions || {}) },
    miscellaneous: { ...DEFAULT_OPTIONS.miscellaneous, ...(options.miscellaneous || {}) }
  };

  const result = await deobfuscate(inputCode, cfg);
  const outputCode = result && result.code ? result.code : String(result);

  if (output) {
    await fsp.writeFile(output, outputCode, 'utf8');
    return await YudzCdnV2(output);
  } else {
    const fileName = filepath
      ? path.basename(filepath, path.extname(filepath)) + '.deob.js'
      : 'deob.js';
    return await YudzCdnV2(Buffer.from(outputCode, 'utf8'), fileName);
  }
}

// Exports (CommonJS)
module.exports = {
  YudzCdnV2,
  deobfuscateInput
};