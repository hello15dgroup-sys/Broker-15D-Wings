import re
import glob

files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # We want to replace user-facing instances of Mission with Charter/Booking, but preserve code variable names (mission, missionId, etc)
    # Be careful not to replace `missionId` or `<Mission` component tags if possible.
    
    # User facing strings:
    content = content.replace('"Mission ', '"Charter ')
    content = content.replace('>Mission ', '>Charter ')
    content = content.replace('Mission ID', 'Booking ID')
    content = content.replace('MISSION ID', 'BOOKING ID')
    content = content.replace('Mission Code', 'Booking Code')
    content = content.replace('MISSION CODE', 'BOOKING CODE')
    content = content.replace('Mission Status', 'Flight Status')
    content = content.replace('MISSION STATUS', 'FLIGHT STATUS')
    content = content.replace('Mission:', 'Charter:')
    content = content.replace('MISSION:', 'CHARTER:')
    
    with open(file, 'w') as f:
        f.write(content)

