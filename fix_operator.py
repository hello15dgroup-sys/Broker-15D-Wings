import sys
content = open('src/pages/OperatorDashboard.tsx').read()
content = content.replace("import { formatCurrency, formatToLocalDate } from '../lib/utils';", "import { formatCurrency, formatToLocalDate } from '../lib/utils';\nimport MissionChat from '../components/chat/MissionChat';")

# Find where missions are mapped
target = '<p className="text-gray-300">Pax: <span className="text-white">{m.pax}</span></p>'
insert_idx = content.find(target)
# Wait, let's see how expanded view looks in OperatorDashboard
