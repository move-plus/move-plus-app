-- Criar tabela payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payments_class_id ON public.payments(class_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON public.payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Habilitar Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Política: Alunos podem ver seus próprios pagamentos
CREATE POLICY "Students can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = student_id);

-- Política: Alunos podem criar seus próprios pagamentos
CREATE POLICY "Students can create their own payments"
ON public.payments
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Política: Alunos podem atualizar seus próprios pagamentos
CREATE POLICY "Students can update their own payments"
ON public.payments
FOR UPDATE
USING (auth.uid() = student_id);

-- Política: Professores podem ver pagamentos das suas turmas
CREATE POLICY "Professionals can view payments for their classes"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = payments.class_id
    AND classes.professional_id = auth.uid()
  )
);

-- Recarregar o schema do PostgREST
NOTIFY pgrst, 'reload schema';
