-- Check Ian's user status
SELECT
    u.id,
    u.name,
    u.email,
    (SELECT COUNT(*) FROM "IntegrationCredential" ic WHERE ic."userId" = u.id AND ic.type = 'slack') as has_slack_integration
FROM "User" u
WHERE u.name LIKE '%Ian%' OR u.email LIKE '%ian%';

-- Check Ian's projects
SELECT
    p.id,
    p.title,
    p.status,
    p."pmId",
    pm.name as pm_name,
    p."lastUpdatedAt"
FROM "Project" p
LEFT JOIN "User" pm ON p."pmId" = pm.id
WHERE p."pmId" IN (SELECT id FROM "User" WHERE name LIKE '%Ian%' OR email LIKE '%ian%')
   OR p.id IN (
       SELECT "projectId"
       FROM "ProjectMember"
       WHERE "userId" IN (SELECT id FROM "User" WHERE name LIKE '%Ian%' OR email LIKE '%ian%')
   )
ORDER BY p."lastUpdatedAt" DESC;

-- Check active projects that should trigger Slack messages
SELECT
    p.id,
    p.title,
    p.status,
    pm.name as pm_name
FROM "Project" p
LEFT JOIN "User" pm ON p."pmId" = pm.id
WHERE p.status IN ('In Progress', 'Not Started', 'Blocked')
ORDER BY p."lastUpdatedAt" ASC;