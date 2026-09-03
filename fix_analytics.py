import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

content = content.replace("totalClosedVolume || 1850000", "totalClosedVolume || 0")
content = content.replace("totalCommissions || 248500", "totalCommissions || 0")
content = content.replace("₦382,400,000", "{formatCurrency(totalClosedVolume ? totalClosedVolume * 1500 : 0, 'NGN')}") # Approximation of NGN volume

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)
