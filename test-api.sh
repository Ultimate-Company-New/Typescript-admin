#!/bin/bash
# Test the API endpoints to see what's happening

# Get the auth token from the network request
echo "Testing getUsersInCarrierInBatches endpoint..."
echo ""

# You'll need to replace TOKEN with the actual bearer token from localStorage
echo "curl -X POST http://localhost:4433/api/User/getUsersInCarrierInBatches \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \\"
echo "  -d '{\"start\":0,\"end\":25,\"includeDeleted\":false}'"
