-- Grant admin role to quarde@yahoo.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('b8d25ca4-9f45-4a7e-902b-5dca2dde6bb1', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;