-- Migration 0003: Create rate limiting and suspicious activity tables
-- This migration creates tables for rate limiting and security monitoring

-- Rate limits table
-- Tracks request counts per identifier (IP or visitor_id) within time windows
CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL,  -- IP address or visitor_id
  endpoint TEXT NOT NULL,     -- 'api/likes' or similar
  window_start INTEGER NOT NULL,  -- Unix timestamp of window start
  request_count INTEGER DEFAULT 1,
  UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits(identifier, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expiry ON rate_limits(window_start);

-- Suspicious activity log
-- Records potentially malicious behavior for analysis and blocking
CREATE TABLE IF NOT EXISTS suspicious_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT NOT NULL,
  visitor_id TEXT,
  user_agent TEXT,
  reason TEXT NOT NULL,  -- 'rate_limit_exceeded', 'multiple_visitors', 'rapid_requests', 'suspicious_ua'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suspicious_ip ON suspicious_activity(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_suspicious_created ON suspicious_activity(created_at);
