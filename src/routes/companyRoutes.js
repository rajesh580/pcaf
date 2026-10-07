const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const { COMPANY_TYPES, COMPANY_TYPE_METADATA, companyHasCapability } = require('../config/companyTypes');

const router = express.Router();

// Store for registered companies
let companies = [];

/**
 * 1. Get All Configurable Company Types & Metadata
 */
router.get('/types', (req, res) => {
  res.json({
    companyTypes: Object.values(COMPANY_TYPES),
    metadata: COMPANY_TYPE_METADATA
  });
});

/**
 * 2. Get All Companies (with type-based filtering, e.g., ?type=DIRECT_HIRING)
 */
router.get('/', authenticate, (req, res) => {
  const { type, search } = req.query;

  let filtered = [...companies];

  if (type) {
    filtered = filtered.filter((c) => c.types.includes(type.toUpperCase()));
  }

  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter((c) =>
      c.name.toLowerCase().includes(term) || c.industry.toLowerCase().includes(term)
    );
  }

  res.json({ total: filtered.length, companies: filtered });
});

/**
 * 3. Register a New Company (Assign single or multiple categories)
 */
router.post('/register', authenticate, checkPermission('COMPANY_MANAGE'), (req, res) => {
  const { name, website, industry, types = [COMPANY_TYPES.DIRECT_HIRING], contactPerson } = req.body;

  if (!name || !types.length) {
    return res.status(400).json({ error: 'Company name and at least one company type are required.' });
  }

  // Validate all selected types exist
  const validTypes = Object.values(COMPANY_TYPES);
  const invalid = types.filter((t) => !validTypes.includes(t));
  if (invalid.length > 0) {
    return res.status(400).json({
      error: `Invalid company types: ${invalid.join(', ')}. Valid types: ${validTypes.join(', ')}`
    });
  }

  const newCompany = {
    id: `comp_${Date.now()}`,
    name,
    website: website || '',
    industry: industry || 'Technology',
    types, // Array of multiple categories
    isVerified: false, // Requires admin approval
    status: 'PENDING_VERIFICATION',
    contactPerson: contactPerson || { name: req.user.name || '', email: req.user.email },
    registeredAt: new Date().toISOString()
  };

  companies.push(newCompany);

  res.status(201).json({
    message: 'Company profile created with assigned categories. Pending platform admin verification.',
    company: newCompany
  });
});

/**
 * 4. Update Company Types & Category Configuration
 */
router.put('/:id/types', authenticate, checkPermission('COMPANY_MANAGE'), (req, res) => {
  const { types } = req.body;
  const company = companies.find((c) => c.id === req.params.id);

  if (!company) return res.status(404).json({ error: 'Company not found.' });

  if (!Array.isArray(types) || types.length === 0) {
    return res.status(400).json({ error: 'Types array cannot be empty.' });
  }

  company.types = types;
  res.json({
    message: 'Company types updated successfully',
    companyId: company.id,
    types: company.types
  });
});

/**
 * 5. Validate Capability Before Action (Helper endpoint for frontend checks)
 */
router.get('/:id/capabilities', authenticate, (req, res) => {
  const company = companies.find((c) => c.id === req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found.' });

  res.json({
    companyId: company.id,
    types: company.types,
    canPostInternships: companyHasCapability(company.types, 'canPostInternships'),
    canPostJobs: companyHasCapability(company.types, 'canPostJobs'),
    canPublishTraining: companyHasCapability(company.types, 'canPublishTraining')
  });
});

module.exports = router;
