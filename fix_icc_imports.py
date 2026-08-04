import sys
content = open('src/pages/ICCDashboard.tsx').read()

old_import = "import { useQuery } from '@tanstack/react-query';"
new_import = "import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';"

content = content.replace(old_import, new_import)

old_lucide = "CheckCircle2, ChevronRight"
new_lucide = "CheckCircle2, CheckCircle, ShieldCheck, ChevronRight"
content = content.replace(old_lucide, new_lucide)

open('src/pages/ICCDashboard.tsx', 'w').write(content)
