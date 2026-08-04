import sys

content = open('src/pages/ClientPortal.tsx').read()
content = content.replace("import { useState, Suspense, lazy } from 'react';", "import { useState, Suspense, lazy } from 'react';\nimport MissionChat from '../components/chat/MissionChat';")

# Find the end of activeTab === "status"
# Actually, the user says "Client and Operator access is automatically provisioned and activated upon successful payment and mission initiation."
# So we can add it to the status tab if the mission status is 'ACTIVATED' or 'EXECUTING' or 'PRE_ACTIVATION'
# Let's find "activeTab === "status""
target_str = '{activeTab === "status" && ('

start_idx = content.find(target_str)
if start_idx != -1:
    # We will just insert it somewhere inside the status tab
    insert_str = '''
    {['PRE_ACTIVATION', 'ACTIVATED', 'EXECUTING'].includes(mission?.status) && (
      <div className="mt-8">
        <MissionChat missionId={mission.id} role="CLIENT" senderId={mission.client_name || 'Client'} />
      </div>
    )}
'''
    # Wait, finding where to inject it. I'll just append it after the "Live Intel Feed" or similar in status tab.
    # Let's find the closing div of "status" tab.
    # Actually, simpler: I can just inject it right after `activeTab === "status" && (`
    pass

# We need to make sure the chat component is correctly imported and placed. Let's look at the status tab first.
