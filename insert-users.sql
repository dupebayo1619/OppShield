DELETE FROM "User" WHERE email IN ('member-a@opsshield.io', 'admin-b@opsshield.io');

INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'member-a@opsshield.io',
  '$2a$12$UxVVutLX.djsUDhTlCYLnuYDsnN16gK8/LduwrHMJRVc5xZczf6dy',
  'Member',
  'A',
  'member',
  NOW(),
  NOW()
);

INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin-b@opsshield.io',
  '$2a$12$7jOI40nt8RbNHU65fpZaD.EiLsXp82pvFYwUzvH9qW4GnGyIxOkfe',
  'Admin',
  'B',
  'admin',
  NOW(),
  NOW()
);

SELECT '✅ Users created successfully!' as status;
