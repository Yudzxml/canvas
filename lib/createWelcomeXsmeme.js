const { 
 createCanvas, 
 registerFont, 
 loadImage
} = require('canvas');
const path = require('path');
const fs2 = require('fs');
const fs = require('fs/promises');
const axios = require('axios');
const FormData = require('form-data');
const moment = require('moment-timezone');
const sharp = require('sharp');
const zonaWaktuIndonesia = 'Asia/Jakarta';
const waktuSekarangIndonesia = moment().tz(zonaWaktuIndonesia);

waktuSekarangIndonesia.locale('id');
const formatTanggal = waktuSekarangIndonesia.format('D MMMM YYYY');

async function YudzCdnV2(filePath) {
  const fileName = path.basename(filePath);
  const form = new FormData();
  form.append('file', fs2.createReadStream(filePath), fileName);

  try {
    const response = await axios.post(`https://cdn.yydz.biz.id/api/v2/upload?apikey=API_X7BOTZ`, form, {
      headers: form.getHeaders(),
    });

    if (response.data && response.data.success) {
      return response.data
    } else {
      throw new Error(response.data.message || 'Upload failed');
    }
  } catch (err) {
    return { error: `Upload gagal: ${err.message}` };
  }
}

async function getImageAndSaveToTempFile(imageURL) {
    try {
        const imageBuffer = await getImageBufferFromURL(imageURL); 
        const tempFilePath = await saveBufferToTempFile(imageBuffer); 
        return tempFilePath; 
    } catch (error) {
        console.error('Error getting image and saving to temp file:', error);
        throw error;
    }
}

async function getImageBufferFromURL(imageURL) {
    try {
        const response = await axios.get(imageURL, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
    }
}

async function saveBufferToTempFile(buffer) {
    try {
        const tmpDir = path.join(__dirname, '../tmp');
        await fs.mkdir(tmpDir, { recursive: true });

        const convertedBuffer = await sharp(buffer).jpeg().toBuffer(); 
        const fileName = `tempfile_${Date.now()}.jpg`;
        const tempFilePath = path.join(tmpDir, fileName);

        await fs.writeFile(tempFilePath, convertedBuffer);
        return tempFilePath;
    } catch (error) {
        console.error('Error saving buffer to temp file:', error);
        throw error;
    }
}

async function generateImage(name, pp, iwelcome) {
    try {
        if (!name || !pp) {
            return console.log('Enter valid parameters (name, pp)');
        }

        if (name.length > 18) {
            name = name.substring(0, 18);
        }

        const bufferPp = await getImageAndSaveToTempFile(pp);
        const date = formatTanggal;

        registerFont(path.resolve(__dirname, 'LEMONMILK-Bold.otf'), { family: 'LEMONMILK' });

        const canvasWidth = 1280;
        const canvasHeight = 720;
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');
        const backgroundImage = await loadImage(path.resolve(__dirname, './'+iwelcome));
        ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);

        const xOffset = 0;
        const yOffset = -71;
        const newProfileRadius = 220;
        const newProfileX = (canvasWidth - newProfileRadius * 2) / 2 + xOffset;
        const newProfileY = (canvasHeight - newProfileRadius * 2) / 2 + yOffset; 
        ctx.save();
        ctx.beginPath();
        ctx.arc(newProfileX + newProfileRadius, newProfileY + newProfileRadius, newProfileRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        const profileImageObj = await loadImage(path.resolve(__dirname, bufferPp));
        ctx.drawImage(profileImageObj, newProfileX, newProfileY, newProfileRadius * 2, newProfileRadius * 2);
        ctx.restore();
        ctx.font = '55px "LEMONMILK"';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.strokeText(`${name}`, 640, 632);
        ctx.fillText(`${name}`, 640, 632);
        await fs.unlink(bufferPp);
        const buffer = canvas.toBuffer('image/png');
        return buffer;
    } catch (error) {
        return console.error(error);
    }
}

async function smeme(text = '', text2 = '', pp, borderWidth = 4) {
    if (!pp) return { status: 400, message: 'Parameter pp tidak valid' };

    try {
        const bufferPp = await getImageAndSaveToTempFile(pp);
        const imageSmeme = await loadImage(bufferPp);

        const fontFamily = 'LEMONMILK';
        registerFont(path.resolve(__dirname, 'LEMONMILK-Bold.otf'), { family: fontFamily });

        const canvas = createCanvas(imageSmeme.width, imageSmeme.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageSmeme, 0, 0, canvas.width, canvas.height);

        let fontSize = Math.floor(canvas.height / 10);
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = borderWidth;
        ctx.fillStyle = '#ffffff';

        const padding = Math.floor(canvas.height * 0.05);
        const maxLineWidth = canvas.width * 0.9;

        function wrapText(text) {
            const words = text.split(' ');
            const lines = [];
            let line = '';
            for (let word of words) {
                const testLine = line + word + ' ';
                if (ctx.measureText(testLine).width > maxLineWidth) {
                    lines.push(line.trim());
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            }
            if (line) lines.push(line.trim());
            return lines;
        }

        const linesTop = text ? wrapText(text) : [];
        const linesBottom = text2 ? wrapText(text2) : [];

        while (
            [...linesTop, ...linesBottom].some(l => ctx.measureText(l).width > maxLineWidth)
            && fontSize > 20
        ) {
            fontSize -= 5;
            ctx.font = `${fontSize}px ${fontFamily}`;
        }

        if (linesTop.length > 0) {
            let totalHeight = linesTop.length * fontSize * 1.2;
            let y = (canvas.height / 5) - (totalHeight / 2);
            for (let line of linesTop) {
                ctx.strokeText(line, canvas.width / 2, y);
                ctx.fillText(line, canvas.width / 2, y);
                y += fontSize * 1.2;
            }
        }

        if (linesBottom.length > 0) {
            let totalHeight = linesBottom.length * fontSize * 1.2;
            let y = canvas.height - padding - (totalHeight - fontSize * 1.1);
            for (let line of linesBottom) {
                ctx.strokeText(line, canvas.width / 2, y);
                ctx.fillText(line, canvas.width / 2, y);
                y += fontSize * 1.2;
            }
        }

        await fs.unlink(bufferPp);
        const buffer = canvas.toBuffer('image/png');
        const tmp_image = await saveBufferToTempFile(buffer);
        const datatourl = await YudzCdnV2(tmp_image);
        await fs.unlink(tmp_image);

        return {
            status: 200,
            author: "Yudzxml",
            result: { 
              url: datatourl.result.url 
            }
        };
    } catch (error) {
        console.error(error);
        return { status: 500, message: 'Terjadi kesalahan saat membuat meme', error: error.message };
    }
}

module.exports = {
  generateImage,
  smeme
};