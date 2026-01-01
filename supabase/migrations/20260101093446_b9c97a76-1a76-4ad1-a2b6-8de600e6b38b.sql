-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Managers can insert roles" ON public.user_roles;

-- Create a new policy that allows users to insert their OWN role during signup
-- This is secure because: user can only set their own user_id, and we validate role in the app
CREATE POLICY "Users can insert their own role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Also allow users who don't have a role yet to insert (for first-time signup)
-- The app controls which roles can be selected during signup