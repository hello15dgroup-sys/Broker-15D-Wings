import sys
content = open('src/pages/ICCDashboard.tsx').read()
content = content.replace('''                               )}                  )}''', '''                               )}''')
open('src/pages/ICCDashboard.tsx', 'w').write(content)
