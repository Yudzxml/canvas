const axios = require("axios");
const { fileTypeFromBuffer } = require("file-type");
const Canvas = require("canvas");
const assets = require("@putuofc/assetsku");

const { createCanvas, loadImage, registerFont } = Canvas;

// Dummy proxy (ubah kalau pakai proxy sungguhan)
const proxy = () => null;

// Registrasi font custom
registerFont(assets.font.get("THEBOLDFONT"), { family: "Bold" });

// === Helper untuk bikin Response gambar ===
const createImageResponse = (buffer, filename = null) => {
  const headers = {
    "Content-Type": "image/jpeg",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  };

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`;
  }

  // Response global tidak ada di CommonJS Node.js, 
  // kalau kamu mau bisa ganti return { buffer, headers } atau gunakan `node-fetch`
  return { buffer, headers };
};

// === Format nama variabel ===
function formatVariable(prefix, variable) {
  const formattedVariable = variable
    .toLowerCase()
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase())
    .join("");
  return prefix + formattedVariable;
}

// === Resize teks agar muat di canvas ===
function applyText(canvas, text, defaultFontSize, width, font) {
  const ctx = canvas.getContext("2d");
  do {
    defaultFontSize -= 1;
    ctx.font = `${defaultFontSize}px ${font}`;
  } while (ctx.measureText(text).width > width);
  return ctx.font;
}

// === Validasi URL gambar ===
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

// === Validasi buffer gambar ===
async function isValidImageBuffer(buffer) {
  const type = await fileTypeFromBuffer(buffer);
  return (
    type !== undefined &&
    ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
  );
}

// === Generate gambar welcome dari URL ===
async function generateWelcomeImageFromURL(
  username,
  guildName,
  guildIcon,
  memberCount,
  avatar,
  background,
  quality
) {
  const canvas = createCanvas(1024, 450);
  const ctx = canvas.getContext("2d");

  const colorUsername = "#ffffff";
  const colorMemberCount = "#ffffff";
  const colorMessage = "#ffffff";
  const colorAvatar = "#ffffff";
  const colorBackground = "#000000";
  const textMemberCount = "- {count}th member !";
  const assent = assets.image.get("WELCOME");

  ctx.fillStyle = colorBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bg = await loadImage((proxy() || "") + background);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  const b = await loadImage(assent);
  ctx.drawImage(b, 0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 1;
  ctx.font = "45px Bold";
  ctx.textAlign = "center";
  ctx.fillStyle = colorUsername;
  ctx.fillText(username, canvas.width - 890, canvas.height - 60);

  ctx.fillStyle = colorMemberCount;
  ctx.font = "22px Bold";
  ctx.fillText(textMemberCount.replace(/{count}/g, memberCount.toString()), 90, canvas.height - 15);

  ctx.globalAlpha = 1;
  ctx.font = "45px Bold";
  ctx.textAlign = "center";
  ctx.fillStyle = colorMessage;
  const name = guildName.length > 13 ? guildName.substring(0, 10) + "..." : guildName;
  ctx.fillText(name, canvas.width - 225, canvas.height - 44);

  // === Avatar ===
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = 10;
  ctx.strokeStyle = colorAvatar;
  ctx.arc(180, 160, 110, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.closePath();
  ctx.clip();
  const av = await loadImage((proxy() || "") + avatar);
  ctx.drawImage(av, 45, 40, 270, 270);
  ctx.restore();

  // === Guild Icon ===
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = 10;
  ctx.strokeStyle = colorAvatar;
  ctx.arc(canvas.width - 150, canvas.height - 200, 80, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.closePath();
  ctx.clip();
  const guildIco = await loadImage((proxy() || "") + guildIcon);
  ctx.drawImage(guildIco, canvas.width - 230, canvas.height - 280, 160, 160);
  ctx.restore();

  return canvas.toBuffer("image/jpeg", { quality: quality / 100 });
}

// === Generate gambar welcome dari buffer file ===
async function generateWelcomeImageFromFile(
  username,
  guildName,
  guildIconBuffer,
  memberCount,
  avatarBuffer,
  backgroundBuffer,
  quality
) {
  const canvas = createCanvas(1024, 450);
  const ctx = canvas.getContext("2d");

  const colorUsername = "#ffffff";
  const colorMemberCount = "#ffffff";
  const colorMessage = "#ffffff";
  const colorAvatar = "#ffffff";
  const colorBackground = "#000000";
  const textMemberCount = "- {count}th member !";
  const assent = assets.image.get("WELCOME");

  ctx.fillStyle = colorBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bg = await loadImage(backgroundBuffer);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  const b = await loadImage(assent);
  ctx.drawImage(b, 0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 1;
  ctx.font = "45px Bold";
  ctx.textAlign = "center";
  ctx.fillStyle = colorUsername;
  ctx.fillText(username, canvas.width - 890, canvas.height - 60);

  ctx.fillStyle = colorMemberCount;
  ctx.font = "22px Bold";
  ctx.fillText(textMemberCount.replace(/{count}/g, memberCount.toString()), 90, canvas.height - 15);

  ctx.globalAlpha = 1;
  ctx.font = "45px Bold";
  ctx.textAlign = "center";
  ctx.fillStyle = colorMessage;
  const name = guildName.length > 13 ? guildName.substring(0, 10) + "..." : guildName;
  ctx.fillText(name, canvas.width - 225, canvas.height - 44);

  // === Avatar ===
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = 10;
  ctx.strokeStyle = colorAvatar;
  ctx.arc(180, 160, 110, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.closePath();
  ctx.clip();
  const av = await loadImage(avatarBuffer);
  ctx.drawImage(av, 45, 40, 270, 270);
  ctx.restore();

  // === Guild Icon ===
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = 10;
  ctx.strokeStyle = colorAvatar;
  ctx.arc(canvas.width - 150, canvas.height - 200, 80, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.closePath();
  ctx.clip();
  const guildIco = await loadImage(guildIconBuffer);
  ctx.drawImage(guildIco, canvas.width - 230, canvas.height - 280, 160, 160);
  ctx.restore();

  return canvas.toBuffer("image/jpeg", { quality: quality / 100 });
}

// === Ekspor fungsi ===
module.exports = {
  createImageResponse,
  formatVariable,
  applyText,
  isValidImageUrl,
  isValidImageBuffer,
  generateWelcomeImageFromURL,
  generateWelcomeImageFromFile,
};