-- Migration 0002: Add security fields to post_likes table
-- This migration adds IP address and User-Agent tracking for security purposes

-- Add IP address column
ALTER TABLE post_likes ADD COLUMN ip_address TEXT;

-- Add User-Agent column
ALTER TABLE post_likes ADD COLUMN user_agent TEXT;

-- Create indexes for faster queries on security fields
CREATE INDEX IF NOT EXISTS idx_post_likes_ip ON post_likes(ip_address);
CREATE INDEX IF NOT EXISTS idx_post_likes_created ON post_likes(created_at);
