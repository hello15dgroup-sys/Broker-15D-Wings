import re

def replace_terms(content):
    # Case sensitive UI text replacements (not variable names)
    content = content.replace("Mission CRM Workspace", "Broker CRM")
    content = content.replace("Mission Broker", "Charter Broker")
    content = content.replace("Mission Code", "Booking Code")
    content = content.replace("MISSION CODE", "BOOKING CODE")
    content = content.replace("MISSION PARAMETERS", "FLIGHT PARAMETERS")
    content = content.replace("Telemetry Vault", "Flight Logs")
    content = content.replace("Operational Radar", "Fleet Tracking")
    content = content.replace("Decision Engine", "Pricing Calculator")
    content = content.replace("Mission Engine", "Broker Engine")
    content = content.replace("Mission Control", "Broker Control")
    content = content.replace("MISSION CONTROL", "BROKER CONTROL")
    content = content.replace("MISSION CUSTOMIZATION", "FLIGHT CUSTOMIZATION")
    content = content.replace("Mission Customization", "Flight Customization")
    content = content.replace("MISSION DEPARTURE", "FLIGHT DEPARTURE")
    content = content.replace("MISSION", "FLIGHT")
    content = content.replace("Mission", "Flight")
    return content

for filepath in ['src/pages/BrokerPortal.tsx', 'src/components/broker/BrokerCRMWorkspace.tsx', 'src/components/broker/ProposalBuilder.tsx', 'src/components/broker/SystemizedCheckoutEngine.tsx']:
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            
        # We need to be careful with variable names like `missionCode`, `missionId`, `mission.id`.
        # The naive `.replace` on "Mission" might be too aggressive, but "Mission" starts with capital, 
        # so it mostly hits text, not `mission` variable unless it's capitalized. Let's do it carefully.
        
        content = replace_terms(content)
        
        with open(filepath, 'w') as f:
            f.write(content)
    except FileNotFoundError:
        pass
