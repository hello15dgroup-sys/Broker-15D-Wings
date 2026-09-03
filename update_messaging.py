with open('src/pages/BrokerPortal.tsx', 'r') as f:
    bp = f.read()

old_bp_text = "Access to the White-Label Proposal Designer Tool is strictly prohibited for unverified accounts. 15D Wings enforces an automated zero-tolerance barrier to prevent unauthorized intermediaries and unverified brokers from distributing uncertified pricing manifests in our ecosystem."
new_bp_text = "To keep charlatans and unauthorized intermediaries out of our ecosystem, 15D Wings requires an active licensed airline partner. Send your custom onboarding link to your partner airline to register on airlines.15dwings.com.ng. Our telemetry rail will automatically detect their backend clearance and unlock your Proposal Designer."

old_bp_btn = "<span>Complete Operator Verification (AOC)</span>"
new_bp_btn = "<span>Invite Operator & Track Telemetry (airlines.15dwings.com.ng)</span>"

bp = bp.replace(old_bp_text, new_bp_text).replace(old_bp_btn, new_bp_btn)

with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(bp)

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    crm = f.read()

crm = crm.replace(old_bp_text, new_bp_text).replace(old_bp_btn, new_bp_btn)

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(crm)

print("Updated messaging in BrokerPortal and BrokerCRMWorkspace")
