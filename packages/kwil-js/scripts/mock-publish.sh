#!/bin/bash
# Mock script for testing workflows without actual publishing

echo "🔒 MOCK MODE: Would have run: pnpm publish $@"
echo "📦 Package details:"
echo "  - Name: @trufnetwork/kwil-js"
echo "  - Version: $(node -p "require('./package.json').version")"
echo "  - Tag: $1"
echo ""
echo "✅ Mock publish successful!"
exit 0