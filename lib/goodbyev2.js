const axios = require("axios")
const { fileTypeFromBuffer } = require("file-type")
const { createCanvas, loadImage, registerFont } = require("canvas")
const assets = require("@putuofc/assetsku")

const proxy = () => null // bisa diganti proxy asli kalau perlu

registerFont(assets.font.get("CUBESTMEDIUM"), { family: "CubestMedium" })

const createImageResponse = (buffer, filename = null) => {
  const headers = {
    "Content-Type": "image/png",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

function isValidImageUrl(url) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    return validExtensions.some((ext) => path.endsWith(ext))
  } catch {
    return false
  }
}

async function processImage(image) {
  if (Buffer.isBuffer(image)) {
    const type = await fileTypeFromBuffer(image)
    if (!type || !["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)) {
      throw new Error("Unsupported image type")
    }
    return image
  } else if (typeof image === "string") {
    const response = await axios.get((proxy() || "") + image, { responseType: "arraybuffer" })
    const buffer = Buffer.from(response.data)
    const type = await fileTypeFromBuffer(buffer)
    if (!type || !["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)) {
      throw new Error("Unsupported image type")
    }
    return buffer
  }
  throw new Error("Invalid image format")
}

async function generateGoodbyeImage(
  username,
  guildName,
  memberCount,
  avatar,
  background
) {
  const canvas = createCanvas(512, 256)
  const ctx = canvas.getContext("2d")
  const fram = assets.image.get("GOODBYE2")

  const [backgroundImg, framImg, avatarImg] = await Promise.all([
    loadImage(await processImage(background)),
    loadImage(fram),
    loadImage(await processImage(avatar)),
  ])

  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height)
  ctx.drawImage(framImg, 0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.beginPath()
  ctx.rotate((-17 * Math.PI) / 180)
  ctx.strokeStyle = "white"
  ctx.lineWidth = 3
  ctx.drawImage(avatarImg, -4, 110, 96, 96)
  ctx.strokeRect(-4, 110, 96, 96)
  ctx.restore()

  const name = guildName.length > 10 ? guildName.substring(0, 10) + "..." : guildName
  ctx.globalAlpha = 1
  ctx.font = "18px CubestMedium"
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(name, 336, 158)

  ctx.font = "700 18px Courier New"
  ctx.textAlign = "left"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(`${memberCount}th member`, 214, 248)

  const namalu = username.length > 12 ? username.substring(0, 15) + "..." : username
  ctx.font = "700 24px Courier New"
  ctx.fillText(namalu, 208, 212)

  return canvas.toBuffer("image/png")
}

module.exports = {
  createImageResponse,
  isValidImageUrl,
  processImage,
  generateGoodbyeImage,
}