const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { cloudinary } = require('./uploadService');

const resumesDir = path.resolve(__dirname, '../../uploads/resumes');
const isCloudinaryHost = (hostname) => hostname === 'cloudinary.com' || hostname.endsWith('.cloudinary.com');

function signedDownloadUrl(assetUrl) {
  const parsed = new URL(assetUrl);
  if (parsed.protocol !== 'https:' || !isCloudinaryHost(parsed.hostname)) {
    throw new Error('The resume URL is not a supported Cloudinary asset.');
  }
  const match = parsed.pathname.match(/\/raw\/(upload|private|authenticated)\/(?:v\d+\/)?(.+)$/);
  if (!match) return parsed.toString();
  const [, deliveryType, encodedPublicId] = match;
  const publicId = decodeURIComponent(encodedPublicId);
  const format = publicId.match(/\.(pdf|docx?)$/i)?.[1]?.toLowerCase() || '';
  return cloudinary.utils.private_download_url(publicId, format, { resource_type: 'raw', type: deliveryType });
}

function requestAsset(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(url); } catch (error) { reject(error); return; }
    if (parsed.protocol !== 'https:' || !isCloudinaryHost(parsed.hostname)) {
      reject(new Error('Cloudinary returned an unsupported resume location.'));
      return;
    }

    const request = https.get(parsed, { headers: { Accept: 'application/pdf,application/octet-stream;q=0.9', 'User-Agent': 'PFAC-Portal resume preview' } }, (response) => {
      const status = response.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location && redirects < 4) {
        response.resume();
        requestAsset(new URL(response.headers.location, parsed).toString(), redirects + 1).then(resolve, reject);
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        reject(new Error(`Cloudinary denied resume access (${status}).`));
        return;
      }

      const chunks = [];
      let size = 0;
      response.on('data', (chunk) => {
        size += chunk.length;
        if (size > 15 * 1024 * 1024) {
          response.destroy(new Error('Resume file exceeds the preview size limit.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: String(response.headers['content-type'] || '').toLowerCase() }));
      response.on('error', reject);
    });
    request.setTimeout(20000, () => request.destroy(new Error('Cloudinary resume request timed out.')));
    request.on('error', reject);
  });
}

function extensionFor(assetUrl, contentType = '') {
  const urlExtension = path.extname(new URL(assetUrl).pathname).toLowerCase();
  if (['.pdf', '.doc', '.docx'].includes(urlExtension)) return urlExtension;
  if (contentType.includes('wordprocessingml')) return '.docx';
  if (contentType.includes('msword')) return '.doc';
  return '.pdf';
}

function assertResumeContent(buffer, contentType) {
  const normalizedType = String(contentType || '').toLowerCase();
  const isPdf = buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  const isZip = buffer.subarray(0, 2).toString('ascii') === 'PK';
  const isLegacyWord = buffer.subarray(0, 8).equals(Buffer.from('D0CF11E0A1B11AE1', 'hex'));
  const isWord = normalizedType.includes('wordprocessingml') || normalizedType.includes('msword') || isZip || isLegacyWord;
  if (!isPdf && !isWord) {
    throw new Error('Cloudinary did not return a valid PDF or Word resume. Check the asset access settings and re-upload the resume.');
  }
}

async function cacheCloudinaryResume(assetUrl) {
  const key = crypto.createHash('sha256').update(assetUrl).digest('hex');
  fs.mkdirSync(resumesDir, { recursive: true });
  const currentExtension = extensionFor(assetUrl);
  const currentPath = path.join(resumesDir, `${key}${currentExtension}`);
  if (fs.existsSync(currentPath)) {
    return { filePath: currentPath, extension: currentExtension, contentType: currentExtension === '.pdf' ? 'application/pdf' : 'application/octet-stream' };
  }

  const downloaded = await requestAsset(signedDownloadUrl(assetUrl));
  assertResumeContent(downloaded.buffer, downloaded.contentType);
  const extension = extensionFor(assetUrl, downloaded.contentType);
  const filePath = path.join(resumesDir, `${key}${extension}`);
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, downloaded.buffer, { flag: 'wx' });
    fs.renameSync(temporaryPath, filePath);
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(temporaryPath);
    else throw error;
  }
  return { filePath, extension, contentType: downloaded.contentType || (extension === '.pdf' ? 'application/pdf' : 'application/octet-stream') };
}

function removeCachedResume(assetUrl) {
  if (!assetUrl || !/^https:\/\//i.test(assetUrl)) return;
  const key = crypto.createHash('sha256').update(assetUrl).digest('hex');
  if (!fs.existsSync(resumesDir)) return;
  for (const file of fs.readdirSync(resumesDir)) {
    if (file.startsWith(`${key}.`)) {
      try { fs.unlinkSync(path.join(resumesDir, file)); } catch (error) { console.warn('Resume cache cleanup failed:', error.message); }
    }
  }
}

module.exports = { resumesDir, cacheCloudinaryResume, removeCachedResume, signedDownloadUrl, isCloudinaryHost };
