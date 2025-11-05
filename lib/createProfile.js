const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve();
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) return reject(`Gagal download: ${url} (Status ${response.statusCode})`);
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err))
    });
  });
}

function drawTextWithEffect(ctx, text, x, y, options = {}) {
  const {
    font = '24px Poppins',
    color = '#ffffff',
    shadowColor = 'rgba(0,0,0,0.5)',
    shadowBlur = 4,
    shadowOffsetX = 0,
    shadowOffsetY = 2,
    outline = false,
    outlineColor = '#000000',
    outlineWidth = 2,
    gradient = null,
    textAlign = 'left',
    letterSpacing = 0,
    maxWidth = null
  } = options;

  ctx.save();
  ctx.font = font;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'middle';
  const sanitizedText = String(text).normalize('NFC');
  if (maxWidth && ctx.measureText(sanitizedText).width > maxWidth) {
    const words = sanitizedText.split(' ');
    let line = '';
    let lines = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    
    lines.forEach((line, index) => {
      const lineY = y + (index * 30);
      
      if (gradient) {
        const gradientObj = ctx.createLinearGradient(x, lineY - 20, x, lineY + 20);
        gradientObj.addColorStop(0, gradient[0]);
        gradientObj.addColorStop(1, gradient[1]);
        ctx.fillStyle = gradientObj;
      } else {
        ctx.fillStyle = color;
      }
      if (outline) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineWidth;
        ctx.strokeText(line, x, lineY);
      }

      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX;
      ctx.shadowOffsetY = shadowOffsetY;
      ctx.fillText(line, x, lineY);
    });
  } else {
    if (letterSpacing > 0) {
      const characters = sanitizedText.split('');
      let currentX = textAlign === 'center' ? x - (ctx.measureText(sanitizedText).width / 2) + (letterSpacing * (characters.length - 1) / 2) : x;
      
      characters.forEach(char => {
        if (gradient) {
          const gradientObj = ctx.createLinearGradient(currentX, y - 20, currentX, y + 20);
          gradientObj.addColorStop(0, gradient[0]);
          gradientObj.addColorStop(1, gradient[1]);
          ctx.fillStyle = gradientObj;
        } else {
          ctx.fillStyle = color;
        }

        if (outline) {
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = outlineWidth;
          ctx.strokeText(char, currentX, y);
        }

        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
        ctx.fillText(char, currentX, y);
        
        currentX += ctx.measureText(char).width + letterSpacing;
      });
    } else {
      if (gradient) {
        const gradientObj = ctx.createLinearGradient(x, y - 20, x, y + 20);
        gradientObj.addColorStop(0, gradient[0]);
        gradientObj.addColorStop(1, gradient[1]);
        ctx.fillStyle = gradientObj;
      } else {
        ctx.fillStyle = color;
      }

      if (outline) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineWidth;
        ctx.strokeText(sanitizedText, x, y);
      }

      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX;
      ctx.shadowOffsetY = shadowOffsetY;
      ctx.fillText(sanitizedText, x, y);
    }
  }

  ctx.restore();
}

function drawAnimatedProgressBar(ctx, x, y, width, height, progress, label) {
  drawTextWithEffect(ctx, label, x, y - 25, {
    font: 'bold 20px Poppins',
    color: '#ffffff',
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 4
  });

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 5;
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  const fillWidth = (progress / 100) * width;
  const barGradient = ctx.createLinearGradient(x, 0, x + fillWidth, 0);
  barGradient.addColorStop(0, '#00ffff');
  barGradient.addColorStop(0.5, '#00ccff');
  barGradient.addColorStop(1, '#0099ff');
  ctx.fillStyle = barGradient;
  ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
  ctx.shadowBlur = 10;
  roundRect(ctx, x, y, fillWidth, height, height / 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.clip();
  const stripeWidth = 20;
  const stripeSpacing = 10;
  const stripeCount = Math.ceil(width / (stripeWidth + stripeSpacing)) + 1;
  
  for (let i = 0; i < stripeCount; i++) {
    const stripeX = x + i * (stripeWidth + stripeSpacing);
    const animatedOffset = (Date.now() / 50) % (stripeWidth + stripeSpacing);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(stripeX - animatedOffset, y);
    ctx.lineTo(stripeX + stripeWidth - animatedOffset, y);
    ctx.lineTo(stripeX + stripeWidth - animatedOffset - 5, y + height);
    ctx.lineTo(stripeX - animatedOffset - 5, y + height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  if (progress > 0 && progress < 100) {
    const glowGradient = ctx.createRadialGradient(
      x + fillWidth, y + height/2, 0,
      x + fillWidth, y + height/2, 20
    );
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x + fillWidth, y + height/2, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTextWithEffect(ctx, `${progress}%`, x + width / 2, y + height / 2, {
    font: 'bold 18px Poppins',
    color: '#ffffff',
    textAlign: 'center',
    shadowColor: 'rgba(0,0,0,0.7)',
    shadowBlur: 4,
    outline: true,
    outlineColor: 'rgba(0,0,0,0.5)',
    outlineWidth: 1
  });
}

function drawBackgroundCover(ctx, img, canvasWidth, canvasHeight) {
  const imgRatio = img.width / img.height;
  const canvasRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, offsetX, offsetY;
  if (imgRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  }
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

async function createProfileCard({
  nama = 'Yudzxml',
  id = '6283123456789',
  status = 'Full-Stack Developer',
  limit = 'Unlimited',
  role = 'Owner',
  level = '99',
  level_cache = 75,
  profilePicUrl = 'https://raw.githubusercontent.com/Yudzxml/UploaderV2/main/tmp/8cac3683.jpg',
  backgroundUrl = 'https://raw.githubusercontent.com/Yudzxml/UploaderV2/main/tmp/89afae07.jpg',
  fontBoldUrl = 'https://raw.githubusercontent.com/Yudzxml/UploaderV2/main/tmp/55efb00c.ttf',
  fontRegularUrl = 'https://raw.githubusercontent.com/Yudzxml/UploaderV2/main/tmp/d3dd65ef.ttf',
  fontAwesomeUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.ttf'
} = {}) {
  try {
    const assetsDir = path.join(__dirname, 'assets');
    const fontsDir = path.join(assetsDir, 'fonts');
    const boldFontPath = path.join(fontsDir, 'Poppins-Bold.ttf');
    const regularFontPath = path.join(fontsDir, 'Poppins-Regular.ttf');
    const iconFontPath = path.join(fontsDir, 'fa-solid-900.ttf');

    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);
    if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir);
    await Promise.all([
      downloadFile(fontBoldUrl, boldFontPath),
      downloadFile(fontRegularUrl, regularFontPath),
      downloadFile(fontAwesomeUrl, iconFontPath)
    ]);
    registerFont(boldFontPath, { family: 'Poppins', weight: 'bold' });
    registerFont(regularFontPath, { family: 'Poppins', weight: 'normal' });
    registerFont(iconFontPath, { family: 'Font Awesome 6 Free' });

    const width = 900;
    const height = 750;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.textDrawingMode = 'glyph';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const [backgroundImage, profileImage] = await Promise.all([
      loadImage(backgroundUrl),
      loadImage(profilePicUrl)
    ]);
    drawBackgroundCover(ctx, backgroundImage, width, height);
    const darkOverlay = ctx.createLinearGradient(0, 0, 0, height);
    darkOverlay.addColorStop(0, 'rgba(10, 10, 20, 0.7)');
    darkOverlay.addColorStop(1, 'rgba(30, 30, 50, 0.9)');
    ctx.fillStyle = darkOverlay;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(width - 200, 0);
    ctx.lineTo(width, 200);
    ctx.lineTo(width, 0);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    const cardX = 50;
    const cardY = 180;
    const cardWidth = width - 100;
    const cardHeight = height - 230;
    const cardRadius = 25;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius);
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    const pfpSize = 180;
    const pfpX = cardX + 60;
    const pfpY = cardY - (pfpSize / 2);
    const glowGradient = ctx.createRadialGradient(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2 - 5, pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2 + 15);
    glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
    glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2 + 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(profileImage, pfpX, pfpY, pfpSize, pfpSize);
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2, 0, Math.PI * 2);
    ctx.stroke();
    const textStartX = pfpX + pfpSize + 60;
    let currentY = cardY + 80;
    ctx.font = 'bold 60px Poppins';
    const nameWidth = ctx.measureText(nama).width;
    const availableWidth = cardWidth - (textStartX - cardX) - 60;
    let fontSize = 60;
    while (nameWidth > availableWidth && fontSize > 20) {
      fontSize -= 5;
      ctx.font = `bold ${fontSize}px Poppins`;
    }
    drawTextWithEffect(ctx, nama, textStartX, currentY, {
      font: `bold ${fontSize}px Poppins`,
      gradient: ['#ffffff', '#00ffff'],
      shadowColor: 'rgba(0,0,0,0.7)',
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 3,
      outline: true,
      outlineColor: 'rgba(0,0,0,0.5)',
      outlineWidth: 2,
      letterSpacing: 1,
      maxWidth: availableWidth
    });

    currentY += fontSize + 10;
    drawTextWithEffect(ctx, status, textStartX, currentY, {
      font: '28px Poppins',
      color: '#00ffff',
      shadowColor: 'rgba(0, 255, 255, 0.8)',
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      letterSpacing: 2,
      maxWidth: availableWidth
    });

    currentY += 40;
    const lineGradient = ctx.createLinearGradient(textStartX, currentY, textStartX + 400, currentY);
    lineGradient.addColorStop(0, '#00ffff');
    lineGradient.addColorStop(1, 'rgba(0, 255, 255, 0.1)');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(textStartX, currentY);
    ctx.lineTo(textStartX + 400, currentY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    currentY += 60;
    const iconSize = 24;
    const labelColor = '#a0a0a0';
    const valueColor = '#ffffff';
    
    const details = [
      { icon: '\uf007', label: 'User ID', value: id },
      { icon: '\uf3a5', label: 'Limit', value: limit },
      { icon: '\uf521', label: 'Role', value: role },
      { icon: '\uf005', label: 'Level', value: level }
    ];

    ctx.font = '20px Poppins';
    const maxLabelWidth = Math.max(...details.map(d => ctx.measureText(d.label).width));
    const labelEndX = textStartX + 40 + maxLabelWidth + 20;

    details.forEach((d, i) => {
      const yPos = currentY + (i * 45);
      
      drawTextWithEffect(ctx, d.icon, textStartX, yPos, {
        font: `${iconSize}px 'Font Awesome 6 Free'`,
        color: '#00ffff',
        shadowColor: 'rgba(0, 255, 255, 0.5)',
        shadowBlur: 5
      });
      
      drawTextWithEffect(ctx, d.label, textStartX + 40, yPos, {
        font: '20px Poppins',
        color: labelColor,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowBlur: 3
      });
      
      drawTextWithEffect(ctx, d.value, labelEndX, yPos, {
        font: 'bold 22px Poppins',
        color: valueColor,
        textAlign: 'left',
        shadowColor: 'rgba(0,0,0,0.7)',
        shadowBlur: 5,
        outline: true,
        outlineColor: 'rgba(0,0,0,0.3)',
        outlineWidth: 1,
        maxWidth: cardWidth - labelEndX - 60
      });
    });
    const barY = cardY + cardHeight - 100;
    const barWidth = cardWidth - 120;
    const barHeight = 30;
    const barX = cardX + 60;
    drawAnimatedProgressBar(ctx, barX, barY, barWidth, barHeight, level_cache, 'Level Progress');
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(cardX + 30, cardY + 30);
    ctx.lineTo(cardX + 100, cardY + 30);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth - 100, cardY + cardHeight - 30);
    ctx.lineTo(cardX + cardWidth - 30, cardY + cardHeight - 30);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cardX + 30, cardY + 50);
    ctx.lineTo(cardX + 30, cardY + 80);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth - 30, cardY + 50);
    ctx.lineTo(cardX + cardWidth - 30, cardY + 80);
    ctx.stroke();

    const dotPositions = [
      { x: cardX + 30, y: cardY + 120 },
      { x: cardX + 30, y: cardY + 140 },
      { x: cardX + 30, y: cardY + 160 },
      { x: cardX + cardWidth - 30, y: cardY + 120 },
      { x: cardX + cardWidth - 30, y: cardY + 140 },
      { x: cardX + cardWidth - 30, y: cardY + 160 }
    ];
    
    dotPositions.forEach(pos => {
      ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Watermark
    drawTextWithEffect(ctx, 'Generated by @Yudzxml', width / 2, height - 20, {
      font: '14px Poppins',
      color: 'rgba(255, 255, 255, 0.4)',
      textAlign: 'center',
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 3
    });
    const buffer = canvas.toBuffer('image/png');
    console.log('✅ Buffer kartu profil berhasil dibuat!');
    return buffer;

  } catch (err) {
    console.error('❌ Terjadi kesalahan:', err);
    throw err;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}


module.exports = {
  createProfileCard
}