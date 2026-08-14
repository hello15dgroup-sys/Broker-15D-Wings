import re

with open('src/pages/BrokerPortal.tsx', 'r') as f:
    content = f.read()

replacement = """  const handleDirectSignIn = async () => {
    setAuthError("");
    setIsAuthenticating(true);
    setTimeout(() => {
        sessionStorage.setItem("broker_verified", "true");
        setSessionVerified(true);
        setIsAuthenticating(false);
    }, 800);
  };"""

content = re.sub(r'const handleDirectSignIn = async \(\) => \{.*?^\s*};\n' , replacement + '\n', content, flags=re.MULTILINE | re.DOTALL)

with open('src/pages/BrokerPortal.tsx', 'w') as f:
    f.write(content)
