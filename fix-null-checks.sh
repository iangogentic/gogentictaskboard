#!/bin/bash

# Fix all null check issues in TypeScript files
echo "Fixing null check issues..."

# Find all .name references that need null checks
find . -name "*.tsx" -o -name "*.ts" | while read file; do
  # Skip node_modules
  if [[ $file == *"node_modules"* ]]; then
    continue
  fi
  
  # Fix .name.slice, .name.charAt, .name.toLowerCase, etc.
  sed -i 's/\([a-zA-Z_][a-zA-Z0-9_]*\)\.name\.\(slice\|charAt\|toLowerCase\|toUpperCase\)/\1.name?.\2/g' "$file" 2>/dev/null
  
  # Fix standalone .name in JSX
  sed -i 's/{[[:space:]]*\([a-zA-Z_][a-zA-Z0-9_]*\)\.name[[:space:]]*}/{(\1.name || "Unknown")}/g' "$file" 2>/dev/null
done

echo "Null check fixes completed"