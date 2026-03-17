CREATE TABLE public.saved_meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  region text NOT NULL DEFAULT 'Pan-Indian',
  plan_data jsonb NOT NULL,
  week_start date NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  week_end date NOT NULL DEFAULT (date_trunc('week', CURRENT_DATE) + interval '6 days')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meal plans"
ON public.saved_meal_plans
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);