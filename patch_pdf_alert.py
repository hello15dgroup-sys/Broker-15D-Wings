import re

with open('src/components/broker/WhiteLabelProposalBuilder.tsx', 'r') as f:
    content = f.read()

replacement = """                    alert(`Proposal PDF for ${missionId} formatted in "${selectedFont}" generated successfully!\\n\\nDYNAMIC VERIFICATION:\\nA QR code has been embedded into this PDF pointing to: https://vip.15dwings.com.ng/verify/${missionId}`);"""

content = re.sub(
    r'alert\(`Proposal PDF for \$\{missionId\} formatted in "\$\{selectedFont\}" downloaded successfully!`\);',
    replacement,
    content
)

with open('src/components/broker/WhiteLabelProposalBuilder.tsx', 'w') as f:
    f.write(content)
