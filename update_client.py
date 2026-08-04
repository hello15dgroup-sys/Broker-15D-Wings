import sys

content = open('src/pages/ClientPortal.tsx').read()
content = content.replace('import { FirebaseChat } from "../components/FirebaseChat";', 'import MissionChat from "../components/chat/MissionChat";')

old_str = '<FirebaseChat missionId={missionId || ""} />'
new_str = '<MissionChat missionId={missionId || ""} role="CLIENT" senderId={mission.client_name || "Client"} />'

content = content.replace(old_str, new_str)

open('src/pages/ClientPortal.tsx', 'w').write(content)
