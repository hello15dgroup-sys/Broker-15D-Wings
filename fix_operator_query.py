with open('src/pages/OperatorDashboard.tsx', 'r') as f:
    content = f.read()

old_line = "const activeBrokerRef = brokerRef || (typeof localStorage !== 'undefined' ? localStorage.getItem('15d_broker_ref') : null);"
new_line = "const activeBrokerRef = (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('broker_ref') || new URLSearchParams(window.location.search).get('ref') || new URLSearchParams(window.location.search).get('broker_id')) : null) || (typeof localStorage !== 'undefined' ? localStorage.getItem('15d_broker_ref') : null);"

content = content.replace(old_line, new_line)

with open('src/pages/OperatorDashboard.tsx', 'w') as f:
    f.write(content)

print("Fixed activeBrokerRef in OperatorDashboard.tsx")
