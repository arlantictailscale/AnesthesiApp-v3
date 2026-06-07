-- Create a security definer function to allow users in a recovery session to reset their own TOTP MFA factors.
CREATE OR REPLACE FUNCTION public.reset_user_mfa()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  jwt_claims jsonb;
  amr_element jsonb;
  has_recovery BOOLEAN := FALSE;
  current_user_id UUID;
BEGIN
  -- Get current user ID from auth.uid()
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get JWT claims
  jwt_claims := auth.jwt();
  
  -- Check if 'recovery' is in the amr claim
  IF jwt_claims ? 'amr' AND jsonb_typeof(jwt_claims -> 'amr') = 'array' THEN
    FOR amr_element IN SELECT * FROM jsonb_array_elements(jwt_claims -> 'amr') LOOP
      -- amr can be a string array or an array of objects like {"method": "recovery"}
      IF jsonb_typeof(amr_element) = 'string' AND amr_element::text = '"recovery"' THEN
        has_recovery := TRUE;
      ELSIF jsonb_typeof(amr_element) = 'object' AND amr_element ->> 'method' = 'recovery' THEN
        has_recovery := TRUE;
      END IF;
    END LOOP;
  END IF;

  -- Delete TOTP factors if recovery session verified
  IF has_recovery THEN
    DELETE FROM auth.mfa_factors
    WHERE user_id = current_user_id AND factor_type = 'totp';
    
    -- Update user metadata to clear mfa_enrolled
    UPDATE auth.users
    SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"mfa_enrolled": false}'::jsonb
    WHERE id = current_user_id;

    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'MFA reset is only allowed during a password recovery session';
  END IF;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reset_user_mfa() TO authenticated;
