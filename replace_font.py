import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    def replace_func(match):
        class_str = match.group(0)
        if 'uppercase' not in class_str:
            return class_str.replace('font-sync', 'font-lexend uppercase')
        return class_str
    
    # Match className="..." strings
    new_content = re.sub(r'className="[^"]*font-sync[^"]*"', replace_func, content)
    new_content = re.sub(r'className=\{`[^`]*font-sync[^`]*`\}', replace_func, new_content)

    with open(filepath, 'w') as f:
        f.write(new_content)

process_file('src/pages/BrokerPortal.tsx')
process_file('src/components/broker/BrokerCRMWorkspace.tsx')
