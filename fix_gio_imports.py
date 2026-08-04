import sys
content = open('src/pages/GIOInterface.tsx').read()
old = "import { useState, Suspense, lazy } from 'react';"
new = "import { useState, Suspense, lazy } from 'react';\nimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';"
if old in content:
    open('src/pages/GIOInterface.tsx', 'w').write(content.replace(old, new))
