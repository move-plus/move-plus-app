-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('professional', 'student', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create professionals table
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cref TEXT NOT NULL,
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  specialty TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their own data"
  ON public.professionals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view professional profiles"
  ON public.professionals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Professionals can update their own data"
  ON public.professionals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Professionals can insert their own data"
  ON public.professionals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  birth_date DATE NOT NULL,
  health_certificate_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own data"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can insert their own data"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own data"
  ON public.students FOR UPDATE
  USING (auth.uid() = user_id);

-- Create demands table
CREATE TABLE public.demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  schedule TEXT NOT NULL,
  num_interested INTEGER NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view demands"
  ON public.demands FOR SELECT
  TO authenticated
  USING (true);

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  activity TEXT NOT NULL,
  description TEXT,
  schedule TEXT NOT NULL,
  max_students INTEGER NOT NULL,
  location TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  demand_id UUID REFERENCES public.demands(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Professionals can manage their own classes"
  ON public.classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.id = classes.professional_id
      AND professionals.user_id = auth.uid()
    )
  );

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, student_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can enroll in classes"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Professionals can view enrollments in their classes"
  ON public.enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      JOIN public.professionals ON professionals.id = classes.professional_id
      WHERE classes.id = enrollments.class_id
      AND professionals.user_id = auth.uid()
    )
  );

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  present BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(enrollment_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage attendance for their classes"
  ON public.attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      JOIN public.classes ON classes.id = enrollments.class_id
      JOIN public.professionals ON professionals.id = classes.professional_id
      WHERE enrollments.id = attendance.enrollment_id
      AND professionals.user_id = auth.uid()
    )
  );

-- Create forum_messages table
CREATE TABLE public.forum_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.forum_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class members can view forum messages"
  ON public.forum_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.class_id = forum_messages.class_id
      AND enrollments.student_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.classes
      JOIN public.professionals ON professionals.id = classes.professional_id
      WHERE classes.id = forum_messages.class_id
      AND professionals.user_id = auth.uid()
    )
  );

CREATE POLICY "Class members can post messages"
  ON public.forum_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.enrollments
        WHERE enrollments.class_id = forum_messages.class_id
        AND enrollments.student_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.classes
        JOIN public.professionals ON professionals.id = classes.professional_id
        WHERE classes.id = forum_messages.class_id
        AND professionals.user_id = auth.uid()
      )
    )
  );

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view payments for their classes"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      JOIN public.professionals ON professionals.id = classes.professional_id
      WHERE classes.id = payments.class_id
      AND professionals.user_id = auth.uid()
    )
  );

-- Allow professionals to view students in their classes
CREATE POLICY "Professionals can view students in their classes"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON c.id = e.class_id
      JOIN professionals p ON p.id = c.professional_id
      WHERE e.student_id = students.user_id
      AND p.user_id = auth.uid()
    )
  );

-- Create storage bucket for health certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('health-certificates', 'health-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for health certificates
CREATE POLICY "Users can upload their own health certificate"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'health-certificates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own health certificate"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'health-certificates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own health certificate"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'health-certificates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');


-- Create private_messages table for one-on-one conversations
CREATE TABLE public.private_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages where they are sender or recipient
CREATE POLICY "Users can view their messages"
ON public.private_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.private_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;

-- Insert sample demands
INSERT INTO public.demands (activity, neighborhood, schedule, num_interested, location) VALUES
  ('Yoga', 'Centro', 'Segunda e Quarta, 8h às 9h', 12, 'Parque Central'),
  ('Pilates', 'Jardim das Flores', 'Terça e Quinta, 15h às 16h', 8, 'Academia FlexFit'),
  ('Hidroginástica', 'Vila Nova', 'Segunda, Quarta e Sexta, 10h às 11h', 15, 'Clube Aquático')
ON CONFLICT DO NOTHING;