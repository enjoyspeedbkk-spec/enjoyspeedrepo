-- =============================================
-- EN-JOY SPEED — Payment verification tracking
-- Adds columns to distinguish between auto-verified (EasySlip)
-- and manually verified (admin click) payments.
-- Also stores EasySlip transaction data for audit trail.
-- =============================================

-- How the payment was verified
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verification_method TEXT;
-- Values: 'easyslip_auto' | 'admin_manual' | 'admin_no_slip' | NULL (not yet verified)
COMMENT ON COLUMN payments.verification_method IS 'How the payment was verified: easyslip_auto, admin_manual, admin_no_slip';

-- EasySlip transaction ID (for cross-referencing with bank records)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS easyslip_txn_id TEXT;

-- EasySlip verified amount (may differ from expected — stored for audit)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS easyslip_amount NUMERIC;

-- Whether the uploaded slip contains a readable QR code
ALTER TABLE payments ADD COLUMN IF NOT EXISTS slip_qr_verified BOOLEAN DEFAULT false;
COMMENT ON COLUMN payments.slip_qr_verified IS 'Whether the slip QR code was readable and amount-matched by EasySlip';
