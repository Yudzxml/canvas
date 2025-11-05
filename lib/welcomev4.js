const { createCanvas, loadImage, registerFont } = require("canvas");
const { fileTypeFromBuffer } = require("file-type");
const assets = require("@putuofc/assetsku");

const proxy = () => null;

registerFont(assets.font.get("MONTSERRAT-BOLD"), { family: "Montserrat" });

const createImageResponse = (buffer, filename = null) => {
  const headers = {
    "Content-Type": "image/jpeg",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  };

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`;
  }

  // Untuk Node.js biasa, return object agar bisa dipakai manual
  return { buffer, headers };
};

function applyText(canvas, text, defaultFontSize, width, font) {
  const ctx = canvas.getContext("2d");
  do {
    defaultFontSize -= 1;
    ctx.font = `${defaultFontSize}px ${font}`;
  } while (ctx.measureText(text).width > width);
  return ctx.font;
}

function isValidImageUrl(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    return validExtensions.some((ext) => path.endsWith(ext));
  } catch {
    return false;
  }
}

async function isValidImageBuffer(buffer) {
  const type = await fileTypeFromBuffer(buffer);
  return (
    type !== undefined &&
    ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
  );
}

async function generateWelcomeV5ImageFromURL(
  username,
  guildName,
  memberCount,
  avatar,
  background,
  quality
) {
  const canvas = createCanvas(1024, 450);
  const ctx = canvas.getContext("2d");

  const bg = await loadImage((proxy() || "") + background);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  const avatarSize = 180;
  const avatarX = canvas.width / 2;
  const avatarY = 140;
  ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const av = await loadImage((proxy() || "") + avatar);
  ctx.drawImage(av, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 5, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.font = `bold 60px Montserrat`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";

  const usernameText = username;
  const usernameWidth = ctx.measureText(usernameText).width;
  if (usernameWidth > canvas.width - 100) {
    ctx.font = applyText(canvas, usernameText, 60, canvas.width - 100, "Montserrat");
  }
  ctx.fillText(usernameText, canvas.width / 2, 290);

  ctx.font = `bold 30px Montserrat`;
  ctx.fillText(`Welcome To ${guildName}`, canvas.width / 2, 340);

  ctx.font = `bold 24px Montserrat`;
  ctx.fillText(`Member ${memberCount}`, canvas.width / 2, 380);

  return canvas.toBuffer("image/jpeg", { quality: quality / 100 });
}

async function generateWelcomeV5ImageFromFile(
  username,
  guildName,
  memberCount,
  avatarBuffer,
  backgroundBuffer,
  quality
) {
  const canvas = createCanvas(1024, 450);
  const ctx = canvas.getContext("2d");

  const bg = await loadImage(backgroundBuffer);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  const avatarSize = 180;
  const avatarX = canvas.width / 2;
  const avatarY = 140;
  ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const av = await loadImage(avatarBuffer);
  ctx.drawImage(av, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 5, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.font = `bold 60px Montserrat`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";

  const usernameText = username;
  const usernameWidth = ctx.measureText(usernameText).width;
  if (usernameWidth > canvas.width - 100) {
    ctx.font = applyText(canvas, usernameText, 60, canvas.width - 100, "Montserrat");
  }
  ctx.fillText(usernameText, canvas.width / 2, 290);

  ctx.font = `bold 30px Montserrat`;
  ctx.fillText(`Welcome To ${guildName}`, canvas.width / 2, 340);

  ctx.font = `bold 24px Montserrat`;
  ctx.fillText(`Member ${memberCount}`, canvas.width / 2, 380);

  return canvas.toBuffer("image/jpeg", { quality: quality / 100 });
}

module.exports = {
  createImageResponse,
  applyText,
  isValidImageUrl,
  isValidImageBuffer,
  generateWelcomeV5ImageFromURL,
  generateWelcomeV5ImageFromFile,
};