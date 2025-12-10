-- Migration: Add repeating bookings functionality
-- Created: 2025-02-10
-- Purpose: Add support for repeating/recurring bookings in the booking system

-- Step 1: Create repeating_bookings table
CREATE TABLE public.repeating_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  title TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'biweekly', 'monthly')),
  recurrence_end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Step 2: Add columns to bookings table for repeating booking reference
ALTER TABLE public.bookings
ADD COLUMN is_repeating BOOLEAN DEFAULT false,
ADD COLUMN parent_repeating_id UUID REFERENCES public.repeating_bookings(id) ON DELETE CASCADE;

-- Step 3: Create index for faster queries
CREATE INDEX idx_repeating_bookings_room_id ON public.repeating_bookings(room_id);
CREATE INDEX idx_repeating_bookings_created_by ON public.repeating_bookings(created_by);
CREATE INDEX idx_repeating_bookings_is_active ON public.repeating_bookings(is_active);
CREATE INDEX idx_bookings_parent_repeating_id ON public.bookings(parent_repeating_id);

-- Step 4: Enable RLS (Row Level Security)
ALTER TABLE public.repeating_bookings ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for repeating_bookings
-- Allow admins to create repeating bookings
CREATE POLICY "Admins can create repeating bookings"
  ON public.repeating_bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to view all repeating bookings
CREATE POLICY "Admins can view all repeating bookings"
  ON public.repeating_bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update repeating bookings they created
CREATE POLICY "Admins can update repeating bookings they created"
  ON public.repeating_bookings
  FOR UPDATE
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete repeating bookings they created
CREATE POLICY "Admins can delete repeating bookings they created"
  ON public.repeating_bookings
  FOR DELETE
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 6: Update RLS policies on bookings table to handle repeating bookings
-- This policy allows viewing bookings that are part of a repeating series
CREATE POLICY "Anyone can view repeating bookings"
  ON public.bookings
  FOR SELECT
  USING (parent_repeating_id IS NOT NULL);
