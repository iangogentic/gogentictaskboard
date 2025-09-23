SELECT 
  'User' as table_name, COUNT(*) as count FROM "User" 
UNION ALL SELECT 
  'Project', COUNT(*) FROM "Project"
UNION ALL SELECT 
  'Task', COUNT(*) FROM "Task"
UNION ALL SELECT 
  'Conversation', COUNT(*) FROM "Conversation"
UNION ALL SELECT 
  'Message', COUNT(*) FROM "Message"
UNION ALL SELECT 
  'AgentSession', COUNT(*) FROM "AgentSession"
UNION ALL SELECT 
  'IntegrationCredential', COUNT(*) FROM "IntegrationCredential"
UNION ALL SELECT 
  'Document', COUNT(*) FROM "Document"
UNION ALL SELECT 
  'Update', COUNT(*) FROM "Update";
