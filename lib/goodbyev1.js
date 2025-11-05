const axios = require("axios")
const { fileTypeFromBuffer } = require("file-type")
const { createCanvas, loadImage, Image, registerFont } = require("canvas")
const assets = require("@putuofc/assetsku")

const proxy = () => null // bisa diganti kalau mau pakai proxy asli

registerFont(assets.font.get("THEBOLDFONT"), { family: "Bold" })

const createImageResponse = (buffer, filename = null) => {
  const headers = {
    "Content-Type": "image/jpeg",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

function formatVariable(prefix, variable) {
  const formattedVariable = variable
    .toLowerCase()
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1, word.length).toLowerCase())
    .join("")
  return prefix + formattedVariable
}

function applyText(canvas, text, defaultFontSize, width, font) {
  const ctx = canvas.getContext("2d")
  do {
    defaultFontSize -= 1
    ctx.font = `${defaultFontSize}px ${font}`
  } while (ctx.measureText(text).width > width)
  return ctx.font
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
  guildIcon,
  memberCount,
  avatar,
  background,
  quality
) {
  const canvas = createCanvas(1024, 450)
  const ctx = canvas.getContext("2d")

  const colorUsername = "#ffffff"
  const colorMemberCount = "#ffffff"
  const colorMessage = "#ffffff"
  const colorAvatar = "#ffffff"
  const colorBackground = "#000000"
  const textMemberCount = "- {count}th member !"
  const assent = assets.image.get("GOODBYE")

  ctx.fillStyle = colorBackground
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const bg = await loadImage(await processImage(background))
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

  const b = await loadImage(assent)
  ctx.drawImage(b, 0, 0, canvas.width, canvas.height)

  ctx.globalAlpha = 1
  ctx.font = "45px Bold"
  ctx.textAlign = "center"
  ctx.fillStyle = colorUsername
  ctx.fillText(username, canvas.width - 890, canvas.height - 60)

  ctx.fillStyle = colorMemberCount
  ctx.font = "22px Bold"
  ctx.fillText(textMemberCount.replace(/{count}/g, memberCount.toString()), 90, canvas.height - 15)

  ctx.globalAlpha = 1
  ctx.font = "45px Bold"
  ctx.textAlign = "center"
  ctx.fillStyle = colorMessage
  const name = guildName.length > 13 ? guildName.substring(0, 10) + "..." : guildName
  ctx.fillText(name, canvas.width - 225, canvas.height - 44)

  ctx.save()
  ctx.beginPath()
  ctx.lineWidth = 10
  ctx.strokeStyle = colorAvatar
  ctx.arc(180, 160, 110, 0, Math.PI * 2, true)
  ctx.stroke()
  ctx.closePath()
  ctx.clip()
  const av = await loadImage(await processImage(avatar))
  ctx.drawImage(av, 45, 40, 270, 270)
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.lineWidth = 10
  ctx.strokeStyle = colorAvatar
  ctx.arc(canvas.width - 150, canvas.height - 200, 80, 0, Math.PI * 2, true)
  ctx.stroke()
  ctx.closePath()
  ctx.clip()
  const guildIco = await loadImage(await processImage(guildIcon))
  ctx.drawImage(guildIco, canvas.width - 230, canvas.height - 280, 160, 160)
  ctx.restore()

  return canvas.toBuffer("image/jpeg", { quality: quality / 100 })
}

module.exports = {
  createImageResponse,
  formatVariable,
  applyText,
  isValidImageUrl,
  processImage,
  generateGoodbyeImage,
}