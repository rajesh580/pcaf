const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadResume, uploadProfilePhoto, uploadToCloudinary } = require('../services/uploadService');

const router = express.Router();

/**
 * Upload student resume to Cloudinary (Section 9)
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

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'pfac/resumes',
        resource_type: 'raw',
        public_id: `resume_${req.user?.id || 'guest'}_${Date.now()}`,
      });

      // Save resumeUrl to student in Neon DB
      const prisma = require('../prisma');
      await prisma.student.updateMany({
        where: { userId: req.user.id },
        data: { resumeUrl: result.secure_url }
      });

      return res.json({
        message: 'Resume uploaded successfully to Cloudinary',
        fileUrl: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
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

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'pfac/profile_photos',
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
        public_id: `avatar_${req.user?.id || 'guest'}_${Date.now()}`,
      });

      return res.json({
        message: 'Profile photo uploaded successfully to Cloudinary',
        photoUrl: result.secure_url,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
