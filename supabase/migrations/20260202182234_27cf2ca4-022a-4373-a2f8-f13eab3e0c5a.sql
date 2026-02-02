-- Add store_id column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_user_roles_store_id ON public.user_roles(store_id);

-- Update the unique constraint to allow multiple store assignments per user
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_store_key UNIQUE (user_id, role, store_id);

-- Create a function to get user's accessible stores
CREATE OR REPLACE FUNCTION public.get_user_stores(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT s.id
  FROM public.stores s
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = 'manager'
      AND ur.store_id IS NULL
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.store_id = s.id
  )
$$;

-- Create a function to check if user has access to a specific store
CREATE OR REPLACE FUNCTION public.has_store_access(_user_id uuid, _store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        (ur.role = 'manager' AND ur.store_id IS NULL)
        OR ur.store_id = _store_id
      )
  )
$$;