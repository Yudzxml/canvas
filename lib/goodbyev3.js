const canvafy = require("canvafy")
const { fileTypeFromBuffer } = require("file-type")

const proxy = () => null // bisa diganti proxy asli kalau perlu

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

async function isValidImageBuffer(buffer) {
  const type = await fileTypeFromBuffer(buffer)
  return type !== undefined && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
}

async function generateGoodbyeImageFromUrl(avatar, background, description) {
  const image = await new canvafy.WelcomeLeave()
    .setAvatar((proxy() || "") + avatar)
    .setBackground("image", (proxy() || "") + background)
    .setTitle("Goodbye")
    .setDescription(description)
    .setBorder("#2a2e35")
    .setAvatarBorder("#2a2e35")
    .setOverlayOpacity(0.3)
    .build()
  return image
}

async function generateGoodbyeImageFromFile(avatarBuffer, backgroundBuffer, description) {
  const image = await new canvafy.WelcomeLeave()
    .setAvatar(avatarBuffer)
    .setBackground("image", backgroundBuffer)
    .setTitle("Goodbye")
    .setDescription(description)
    .setBorder("#2a2e35")
    .setAvatarBorder("#2a2e35")
    .setOverlayOpacity(0.3)
    .build()
  return image
}

module.exports = {
  createImageResponse,
  isValidImageUrl,
  isValidImageBuffer,
  generateGoodbyeImageFromUrl,
  generateGoodbyeImageFromFile,
}