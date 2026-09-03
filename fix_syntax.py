with open('src/pages/BrokerPortal.tsx', 'r') as f:
    content = f.read()

bad_string = "return \\(\\) => subscription\\.unsubscribe\\(\\);\n  \\}, \\[\\]\\);"
good_string = "return () => subscription.unsubscribe();\n  }, []);"

content = content.replace(bad_string, good_string)

with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(content)
