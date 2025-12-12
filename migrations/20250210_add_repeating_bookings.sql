-- Migrering: Tilføj tilbagevendende bookingfunktionalitet
-- Oprettet: 2025-02-10
-- Formål: Tilføj understøttelse af tilbagevendende/gentagende bookinger i bookingsystemet

-- Trin 1: Opret tilbagevendende_bookinger tabel
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

-- Trin 2: Tilføj kolonner til bookinger tabel for tilbagevendende booking reference
ALTER TABLE public.bookings
ADD COLUMN is_repeating BOOLEAN DEFAULT false,
ADD COLUMN parent_repeating_id UUID REFERENCES public.repeating_bookings(id) ON DELETE CASCADE;

-- Trin 3: Opret indeks for hurtigere forespørgsler
CREATE INDEX idx_repeating_bookings_room_id ON public.repeating_bookings(room_id);
CREATE INDEX idx_repeating_bookings_created_by ON public.repeating_bookings(created_by);
CREATE INDEX idx_repeating_bookings_is_active ON public.repeating_bookings(is_active);
CREATE INDEX idx_bookings_parent_repeating_id ON public.bookings(parent_repeating_id);

-- Trin 4: Aktivér RLS (Row Level Security)
ALTER TABLE public.repeating_bookings ENABLE ROW LEVEL SECURITY;

-- Trin 5: Opret RLS-politikker for tilbagevendende_bookinger
-- Tillad admins at oprette tilbagevendende bookinger
CREATE POLICY "Admins can create repeating bookings"
  ON public.repeating_bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tillad admins at se alle tilbagevendende bookinger
CREATE POLICY "Admins can view all repeating bookings"
  ON public.repeating_bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tillad admins at opdatere tilbagevendende bookinger de har oprettet
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

-- Tillad admins at slette tilbagevendende bookinger de har oprettet
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

-- Trin 6: Opdater RLS-politikker på bookinger tabel for at håndtere tilbagevendende bookinger
-- Denne politik tillader visning af bookinger der er del af en tilbagevendende serie
CREATE POLICY "Anyone can view repeating bookings"
  ON public.bookings
  FOR SELECT
  USING (parent_repeating_id IS NOT NULL);
