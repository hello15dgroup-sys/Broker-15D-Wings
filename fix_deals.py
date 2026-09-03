import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [isLoadingData, setIsLoadingData] = useState(true); = useState<DealPipelineItem[]>([]);", "const [isLoadingData, setIsLoadingData] = useState(true);")

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)
