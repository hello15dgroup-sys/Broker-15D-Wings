import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

messaging_section_regex = r"\{activeSubTab === 'messaging' && \(\s*<motion\.div.*?</motion\.div>\s*\)\}"
content = re.sub(messaging_section_regex, "", content, flags=re.DOTALL)

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)
