import re

with open('lib/google-drive.ts', 'r') as f:
    content = f.read()

# Fix lines that end with }); but shouldn't
content = re.sub(r'new GoogleDriveService\(\}\);', r'new GoogleDriveService();', content)
content = re.sub(r'getToken\(code\}\);', r'getToken(code);', content)
content = re.sub(r'Error\("([^"]+)"\}\);', r'Error("\1");', content)
content = re.sub(r'\.findFirst\(\{([^}]+)\}\}\);', r'.findFirst({\1});', content)
content = re.sub(r'\.setCredentials\(\{([^}]+)\}\}\);', r'.setCredentials({\1});', content)
content = re.sub(r'getDriveClient\(userId\}\);', r'getDriveClient(userId);', content)
content = re.sub(r'createFolder\(userId, projectName\}\);', r'createFolder(userId, projectName);', content)
content = re.sub(r'createFolder\(userId, name, rootFolder\.id\}\);', r'createFolder(userId, name, rootFolder.id);', content)
content = re.sub(r'error\.message, ([^}]+)\}\);', r'error.message, \1);', content)
content = re.sub(r'drive\.files\.delete\(\{ fileId \}\}\);', r'drive.files.delete({ fileId });', content)
content = re.sub(r'drive\.about\.get\(\{ fields: "user" \}\}\);', r'drive.about.get({ fields: "user" });', content)
content = re.sub(r'console\.error\("([^"]+)", error\}\);', r'console.error("\1", error);', content)

# Fix return statements that have extra });
content = re.sub(r'(\s+)return google\.drive\(\{ version: "v3", auth: this\.oauth2Client \}\}\);', r'\1return google.drive({ version: "v3", auth: this.oauth2Client });', content)

# Fix all }); at the end of lines where it should be just );
content = re.sub(r'    \}\}\);$', r'    });', content, flags=re.MULTILINE)
content = re.sub(r'    \]\n      \}\);', r'    ]\n      );', content, flags=re.MULTILINE)

with open('lib/google-drive.ts', 'w') as f:
    f.write(content)

print("Fixed google-drive.ts")
