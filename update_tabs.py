import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

# 1. Update State Type & Initial
content = content.replace(
    "'pipeline' | 'clients' | 'proposals' | 'history' | 'analytics' | 'messaging' | 'tasks' | 'directory' | 'team'",
    "'tasks' | 'pipeline' | 'clients' | 'proposals' | 'history' | 'analytics' | 'directory' | 'team'"
)
content = content.replace(">('pipeline');", ">('tasks');")

# 2. Remove Messaging Button
messaging_button_regex = r"<button\s+onClick=\{\(\) => setActiveSubTab\('messaging'\)\}.*?</button>"
content = re.sub(messaging_button_regex, "", content, flags=re.DOTALL)

# 3. Remove Messaging Component section
messaging_section_regex = r"\{activeSubTab === 'messaging' && \(\s*<motion\.div.*?</motion\.div>\s*\)\}"
content = re.sub(messaging_section_regex, "", content, flags=re.DOTALL)

# 4. Move Tasks button to front. 
# It's currently around line 718. Let's match it and move it.
tasks_button_regex = r"(<button\s+onClick=\{\(\) => setActiveSubTab\('tasks'\)\}.*?</button>)"
match = re.search(tasks_button_regex, content, re.DOTALL)
if match:
    tasks_btn = match.group(1)
    content = content.replace(tasks_btn, "")
    
    # Insert it right before the Pipeline button
    pipeline_btn_regex = r"<button\s+onClick=\{\(\) => setActiveSubTab\('pipeline'\)\}"
    content = content.replace("<button\n            onClick={() => setActiveSubTab('pipeline')}", tasks_btn + "\n\n          <button\n            onClick={() => setActiveSubTab('pipeline')}")

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)
