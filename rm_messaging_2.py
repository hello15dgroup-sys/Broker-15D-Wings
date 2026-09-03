import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

regex = r"\{activeSubTab === 'messaging' && \(\s*<div.*?</form>\s*</div>\s*\)\}"
content = re.sub(regex, "", content, flags=re.DOTALL)

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)
