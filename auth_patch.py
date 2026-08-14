import re
import sys

with open('src/pages/BrokerPortal.tsx', 'r') as f:
    content = f.read()

# Change the `sessionVerified` logic from searchParams to state
content = re.sub(
    r'const sessionVerified = searchParams\.get\("verified"\) === "true";',
    r'const [sessionVerified, setSessionVerified] = useState(sessionStorage.getItem("broker_verified") === "true");',
    content
)

# Remove `if (!missionId || !sessionVerified) {` wrapper for the login screen.
# We will just check `!sessionVerified`.
content = content.replace(
    'if (!missionId || !sessionVerified) {',
    'if (!sessionVerified) {'
)

# In handleDirectSignIn or form submission, setSessionVerified(true) instead of navigating with search params.
# We need to find the login handlers. Let's just find the form submit for login.
# There is `handleDirectSignIn` and `verifyOtp` or similar. Let's look for `handleDirectSignIn`.

# Write it back for now, let's see.
with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(content)
