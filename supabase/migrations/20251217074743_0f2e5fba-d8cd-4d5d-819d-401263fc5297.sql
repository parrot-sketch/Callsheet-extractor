-- Create productions table
CREATE TABLE public.productions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_id UUID REFERENCES public.productions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  call_time TEXT,
  wrap_time TEXT,
  location TEXT,
  source_file TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create uploads tracking table
CREATE TABLE public.uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_id UUID REFERENCES public.productions(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  contacts_extracted INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for this tool)
CREATE POLICY "Allow all access to productions" ON public.productions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to contacts" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to uploads" ON public.uploads FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for search
CREATE INDEX idx_contacts_name ON public.contacts USING gin(to_tsvector('english', name));
CREATE INDEX idx_contacts_production ON public.contacts(production_id);
CREATE INDEX idx_contacts_department ON public.contacts(department);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for productions
CREATE TRIGGER update_productions_updated_at
  BEFORE UPDATE ON public.productions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();