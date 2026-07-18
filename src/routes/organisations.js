const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, requireOrgMember, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const orgController = require('../controllers/organisations');

// GET all organisations for the current user
router.get('/',
  authenticate,
  orgController.list
);

// GET a specific organisation
router.get('/:orgId',
  authenticate, requireOrgMember,
  orgController.get
);

// UPDATE organisation (admin only)
router.patch('/:orgId',
  authenticate, requireOrgMember, requireAdmin,
  [body('name').optional().trim().notEmpty().isLength({ max: 100 })],
  validate,
  orgController.update
);

// GET audit log (admin only)
router.get('/:orgId/audit-log',
  authenticate, requireOrgMember, requireAdmin,
  orgController.auditLog
);

// VERIFY audit log (admin only)
router.get('/:orgId/audit-log/verify',
  authenticate, requireOrgMember, requireAdmin,
  orgController.verifyAuditChain
);

module.exports = router;
