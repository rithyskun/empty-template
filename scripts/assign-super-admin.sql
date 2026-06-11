-- Assign SUPER_ADMIN role to user 13b32025-af36-4ec4-8834-3dadff8baf09
-- Run against the identity-service database

DO $$
DECLARE
  v_user_id  uuid := '13b32025-af36-4ec4-8834-3dadff8baf09';
  v_role_id  uuid;
  v_tenant_id uuid;
BEGIN
  -- 1. Verify the user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User % not found', v_user_id;
  END IF;

  -- 2. Find the SUPER_ADMIN role by code
  SELECT id INTO v_role_id
  FROM roles
  WHERE code = 'SUPER_ADMIN'
  LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'SUPER_ADMIN role not found in roles table';
  END IF;

  -- 3. Get the user's tenant_id (optional, but keeps data consistent)
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = v_user_id;

  -- 4. Insert the role assignment if it doesn't already exist
  INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at, assigned_by)
  VALUES (v_user_id, v_role_id, v_tenant_id, now(), NULL)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- 5. Report result
  IF FOUND THEN
    RAISE NOTICE 'Successfully assigned SUPER_ADMIN role (%) to user (%)', v_role_id, v_user_id;
  ELSE
    RAISE NOTICE 'User (%) already has SUPER_ADMIN role assigned', v_user_id;
  END IF;
END $$;
