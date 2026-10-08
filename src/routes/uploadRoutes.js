const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadResume, uploadProfilePhoto, uploadToCloudinary, cloudinary } = require('../services/uploadService');
const { resumesDir, cacheCloudinaryResume, removeCachedResume } = require('../services/resumeAssetService');
const prisma = require('../prisma');

const router = express.Router();

function streamCloudinaryResume(fetchUrl, res, format, attachment) {
  const allowedHost = (hostname) => hostname === 'cloudinary.com' || hostname.endsWith('.cloudinary.com');
  const send = (url, redirects = 0) => {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:' || !allowedHost(parsedUrl.hostname)) {
      return res.status(502).json({ error: 'Cloudinary returned an unsupported resume location.' });
    }
    const upstream = https.get(parsedUrl, { headers: { Accept: 'application/pdf,application/octet-stream;q=0.9', 'User-Agent': 'PFAC-Portal resume access' } }, (assetRes) => {
      const status = assetRes.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status) && assetRes.headers.location && redirects < 4) {
        assetRes.resume();
        return send(new URL(assetRes.headers.location, parsedUrl).toString(), redirects + 1);
      }
      if (status < 200 || status >= 300) {
        assetRes.resume();
        return res.status(502).json({ error: 'Cloudinary denied access to this resume. Re-upload the file through Resume Management to store a portal copy.' });
      }
      const upstreamType = String(assetRes.headers['content-type'] || '').toLowerCase();
      const isWord = upstreamType.includes('wordprocessingml') || upstreamType.includes('msword') || ['doc', 'docx'].includes(format);
      if (!attachment && isWord) {
        assetRes.resume();
        return res.status(415).json({ error: 'This resume is a Word document. Download it or upload a PDF for inline preview.' });
      }
      const ext = format || (upstreamType.includes('wordprocessingml') ? 'docx' : upstreamType.includes('msword') ? 'doc' : 'pdf');
      const contentType = ext === 'pdf' ? 'application/pdf' : ext === 'doc' ? 'application/msword' : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : upstreamType || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `${attachment ? 'attachment' : 'inline'}; filename="resume.${ext}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      assetRes.pipe(res);
    });
    upstream.on('error', (error) => {
      console.error('Cloudinary resume request failed:', error.message);
      if (!res.headersSent) res.status(502).json({ error: 'Could not retrieve this resume from Cloudinary. Re-upload it through Resume Management to store a portal copy.' });
      else res.destroy(error);
    });
  };
  send(fetchUrl);
}

/**
 * GET /api/upload/resume/preview
 * Streams the active student resume for in-page viewing (PDF inline)
 */
router.get('/resume/preview', authenticate, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      select: { resumeUrl: true },
    });
    if (!student?.resumeUrl) {
      return res.status(404).json({ error: 'No resume linked to this account.' });
    }

    // Handle local file
    if (student.resumeUrl.startsWith('/uploads/')) {
      const localFilePath = path.join(__dirname, '../..', student.resumeUrl);
      if (fs.existsSync(localFilePath)) {
        const ext = path.extname(localFilePath).toLowerCase();
        const contentType = ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
        res.setHeader('Cache-Control', 'private, no-store');
        return fs.createReadStream(localFilePath).pipe(res);
      }
    }

    // Download and cache a Cloudinary asset only when its preview is requested.
    if (student.resumeUrl.includes('cloudinary.com')) {
      const cached = await cacheCloudinaryResume(student.resumeUrl);
      if (cached.extension !== '.pdf') return res.status(415).json({ error: 'This resume is a Word document. Download it or upload a PDF for inline preview.' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      return fs.createReadStream(cached.filePath).pipe(res);
    }

    return res.status(404).json({ error: 'Resume file unavailable. Please re-upload your resume file.' });
  } catch (error) {
    console.error('Resume preview error:', error);
    return res.status(502).json({ error: error.message || 'Failed to stream resume preview.' });
  }
});

/**
 * GET /api/upload/resume/download
 * Downloads student resume as file attachment
 */
router.get('/resume/download', authenticate, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      select: { resumeUrl: true },
    });
    if (!student?.resumeUrl) {
      return res.status(404).json({ error: 'No resume linked to this account.' });
    }

    // Local file handling
    if (student.resumeUrl.startsWith('/uploads/')) {
      const localFilePath = path.join(__dirname, '../..', student.resumeUrl);
      if (fs.existsSync(localFilePath)) {
        const ext = path.extname(localFilePath).toLowerCase();
        const contentType = ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="resume${ext}"`);
        res.setHeader('Cache-Control', 'private, no-store');
        return fs.createReadStream(localFilePath).pipe(res);
      }
    }

    // Legacy Cloudinary fallback
    if (student.resumeUrl.includes('cloudinary.com')) {
      const assetUrl = new URL(student.resumeUrl);
      const match = assetUrl.pathname.match(/\/upload\/(?:v\d+\/)?(.+)$/);
      let fetchUrl = student.resumeUrl;
      if (match && match[1]) {
        const publicId = decodeURIComponent(match[1]);
        const format = publicId.match(/\.(pdf|docx?)$/i)?.[1]?.toLowerCase() || '';
        fetchUrl = cloudinary.utils.private_download_url(publicId, format, {
          resource_type: 'raw',
          type: 'upload',
        });
      }

      return streamCloudinaryResume(fetchUrl, res, match?.[1]?.match(/\.(pdf|docx?)$/i)?.[1]?.toLowerCase() || '', true);
    }

    return res.status(404).json({ error: 'Resume file not found on server.' });
  } catch (error) {
    console.error('Resume download error:', error);
    return res.status(500).json({ error: 'Failed to download resume.' });
  }
});

/**
 * POST /api/upload/resume
 * Upload student resume to Cloudinary and save its URL as the primary record.
 */
router.post(
  '/resume',
  authenticate,
  authorize('STUDENT'),
  uploadResume.single('resume'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload a resume file (PDF/DOCX).' });
      }

      const originalName = req.file.originalname || 'resume.pdf';
      const safeExtension = originalName.match(/\.(pdf|docx?)$/i)?.[0]?.toLowerCase() || '.pdf';
      const safeBaseName = originalName
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/^_+|_+$/g, '') || 'resume';

      const filename = `resume_${req.user?.id || 'user'}_${Date.now()}_${safeBaseName}${safeExtension}`;
      const previousStudent = await prisma.student.findUnique({
        where: { userId: req.user.id },
        select: { resumeUrl: true },
      });
      if (!previousStudent) return res.status(404).json({ error: 'Student profile not found.' });

      if (!process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_URL) {
        return res.status(503).json({ error: 'Cloudinary is not configured. Resume uploads are unavailable until cloud storage is connected.' });
      }
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'pfac/resumes',
        resource_type: 'raw',
        public_id: filename.replace(/\.[^.]+$/, ''),
        type: 'upload',
      });
      if (!result?.secure_url) return res.status(502).json({ error: 'Cloudinary did not return a secure resume URL.' });

      try {
        await prisma.student.update({ where: { userId: req.user.id }, data: { resumeUrl: result.secure_url } });
      } catch (error) {
        cloudinary.uploader.destroy(result.public_id, { resource_type: 'raw', type: 'upload' }).catch((cleanupError) => console.warn('Unlinked Cloudinary resume cleanup failed:', cleanupError.message));
        throw error;
      }

      // The student record has one resumeUrl field, so the new value replaces
      // the old database reference. Remove an older portal file after commit.
      const oldResumeUrl = previousStudent.resumeUrl;
      if (oldResumeUrl?.startsWith('/uploads/resumes/')) {
        const uploadsRoot = path.resolve(resumesDir);
        const oldFilePath = path.resolve(uploadsRoot, path.basename(oldResumeUrl));
        if (oldFilePath.startsWith(`${uploadsRoot}${path.sep}`) && fs.existsSync(oldFilePath)) {
          try { fs.unlinkSync(oldFilePath); }
          catch (error) { console.warn('Previous local resume cleanup failed:', error.message); }
        }
      } else {
        removeCachedResume(oldResumeUrl);
      }

      return res.json({
        message: 'Resume uploaded to Cloudinary and linked to your profile.',
        fileUrl: result.secure_url,
      });
    } catch (error) {
      console.error('Resume upload error:', error);
      return res.status(500).json({ error: error.message || 'Failed to upload resume' });
    }
  }
);

/**
 * POST /api/upload/avatar
 * Upload profile photo to Cloudinary
 */
router.post(
  '/avatar',
  authenticate,
  uploadProfilePhoto.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload an image file.' });
      }

      if (!req.file.mimetype?.startsWith('image/')) {
        return res.status(400).json({ error: 'Profile pictures must be an image file.' });
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'pfac/profile_photos',
        resource_type: 'image',
        transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }],
        public_id: `avatar_${req.user?.id || 'guest'}_${Date.now()}`,
      });

      await prisma.user.update({
        where: { id: req.user.id },
        data: { photoUrl: result.secure_url },
      });

      return res.json({
        message: 'Profile photo uploaded successfully',
        photoUrl: result.secure_url,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
