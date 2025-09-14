-- CLEANUP DUPLICATE USERS SCRIPT
-- Run this in your database to consolidate duplicate accounts

-- Step 1: Identify the duplicate users
-- Primary Ian account to keep: ian@gogentic.ai (or choose your preferred one)
-- Test account to keep: test@example.com

-- Step 2: Update all references from duplicate Ians to the primary one
-- Replace 'PRIMARY_IAN_ID' with the ID of ian@gogentic.ai user
-- Replace other IDs accordingly

-- First, check what we have:
SELECT id, email, name FROM "User" WHERE email IN (
  'ian@gogentic.com',
  'ianigreenberg@gmail.com', 
  'ian@gogentic.ai',
  'test@example.com',
  'testuser@example.com'
);

-- Example consolidation (adjust IDs based on your database):
-- UPDATE "Project" SET "pmId" = 'PRIMARY_IAN_ID' WHERE "pmId" IN ('OLD_IAN_ID_1', 'OLD_IAN_ID_2');
-- UPDATE "Task" SET "assigneeId" = 'PRIMARY_IAN_ID' WHERE "assigneeId" IN ('OLD_IAN_ID_1', 'OLD_IAN_ID_2');
-- UPDATE "Update" SET "authorId" = 'PRIMARY_IAN_ID' WHERE "authorId" IN ('OLD_IAN_ID_1', 'OLD_IAN_ID_2');
-- UPDATE "TimeEntry" SET "userId" = 'PRIMARY_IAN_ID' WHERE "userId" IN ('OLD_IAN_ID_1', 'OLD_IAN_ID_2');

-- Step 3: Remove developer associations for duplicates
-- DELETE FROM "_ProjectDevelopers" WHERE "B" IN ('OLD_IAN_ID_1', 'OLD_IAN_ID_2');

-- Step 4: Delete the duplicate users
-- DELETE FROM "User" WHERE email IN ('ian@gogentic.com', 'ianigreenberg@gmail.com');
-- DELETE FROM "User" WHERE email = 'testuser@example.com';

-- Step 5: Verify the cleanup
SELECT id, email, name FROM "User" ORDER BY name;