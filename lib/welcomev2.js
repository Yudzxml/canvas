const axios = require("axios");
const { fileTypeFromBuffer } = require("file-type");
const Canvas = require("canvas");
const assets = require("@putuofc/assetsku");

// Ambil method dari Canvas
const { createCanvas, loadImage, registerFont } = Canvas;

// Deklarasi proxy function (dummy bisa diubah kalau mau pakai proxy)
const proxy = () => null;

// Registrasi font custom
registerFont(assets.font.get("CUBESTMEDIUM"), { family: "CubestMedium" });

/**
 * Buat response image (buffer + header)
 */
const createImageResponse = (buffer, filename = null) => {
  const headers = {
    "Content-Type": "image/png",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  };

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`;
  }

  return new Response(buffer, { headers });
};

/**
 * Validasi apakah URL mengarah ke image valid
 */
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

/**
 * Validasi apakah buffer adalah image valid
 */
async function isValidImageBuffer(buffer) {
  const type = await fileTypeFromBuffer(buffer);
  return (
    type !== undefined &&
    ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
  );
}

/**
 * Generate Welcome Image (ambil gambar dari URL)
 */
async function generateWelcomeV2ImageFromURL(
  username,
  guildName,
  memberCount,
  avatar,
  background
) {
  const canvas = createCanvas(512, 256);
  const ctx = canvas.getContext("2d");
  const fram = assets.image.get("WELCOME2");

  const [backgroundImg, framImg, avatarImg] = await Promise.all([
    loadImage((proxy() || "") + background).catch(() =>
      loadImage(assets.image.get("DEFAULT_BG"))
    ),
    loadImage(fram).catch(() => loadImage(assets.image.get("DEFAULT_FRAME"))),
    loadImage((proxy() || "") + avatar).catch(() =>
      loadImage(assets.image.get("DEFAULT_AVATAR"))
    ),
  ]);

  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(framImg, 0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.rotate((-17 * Math.PI) / 180);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.drawImage(avatarImg, -4, 110, 96, 96);
  ctx.strokeRect(-4, 110, 96, 96);
  ctx.restore();

  const name = guildName.length > 10 ? guildName.substring(0, 10) + "..." : guildName;
  ctx.globalAlpha = 1;
  ctx.font = "18px CubestMedium";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(name, 336, 158);

  ctx.font = "700 18px Courier New";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${memberCount}th member`, 214, 248);

  const namalu = username.length > 12 ? username.substring(0, 15) + "..." : username;
  ctx.font = "700 24px Courier New";
  ctx.fillText(namalu, 208, 212);

  return canvas.toBuffer("image/png");
}

/**
 * Generate Welcome Image (ambil dari buffer file)
 */
async function generateWelcomeV2ImageFromFile(
  username,
  guildName,
  memberCount,
  avatarBuffer,
  backgroundBuffer
) {
  const canvas = createCanvas(512, 256);
  const ctx = canvas.getContext("2d");
  const fram = assets.image.get("WELCOME2");

  const [backgroundImg, framImg, avatarImg] = await Promise.all([
    loadImage(backgroundBuffer).catch(() => loadImage(assets.image.get("DEFAULT_BG"))),
    loadImage(fram).catch(() => loadImage(assets.image.get("DEFAULT_FRAME"))),
    loadImage(avatarBuffer).catch(() => loadImage(assets.image.get("DEFAULT_AVATAR"))),
  ]);

  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(framImg, 0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.rotate((-17 * Math.PI) / 180);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.drawImage(avatarImg, -4, 110, 96, 96);
  ctx.strokeRect(-4, 110, 96, 96);
  ctx.restore();

  const name = guildName.length > 10 ? guildName.substring(0, 10) + "..." : guildName;
  ctx.globalAlpha = 1;
  ctx.font = "18px CubestMedium";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(name, 336, 158);

  ctx.font = "700 18px Courier New";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${memberCount}th member`, 214, 248);

  const namalu = username.length > 12 ? username.substring(0, 15) + "..." : username;
  ctx.font = "700 24px Courier New";
  ctx.fillText(namalu, 208, 212);

  return canvas.toBuffer("image/png");
}

// Export semua fungsi biar bisa dipakai di file lain
module.exports = {
  createImageResponse,
  isValidImageUrl,
  isValidImageBuffer,
  generateWelcomeV2ImageFromURL,
  generateWelcomeV2ImageFromFile,
};