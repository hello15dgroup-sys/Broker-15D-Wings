import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

# Instead of removing them, I'll just change them to empty arrays to keep types correct if they are exported or used.
content = re.sub(r'export const INITIAL_CLIENTS: ClientProfile\[\] = \[.*?\];', r'export const INITIAL_CLIENTS: ClientProfile[] = [];', content, flags=re.DOTALL)
content = re.sub(r'export const INITIAL_DEALS: DealPipelineItem\[\] = \[.*?\];', r'export const INITIAL_DEALS: DealPipelineItem[] = [];', content, flags=re.DOTALL)

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)

