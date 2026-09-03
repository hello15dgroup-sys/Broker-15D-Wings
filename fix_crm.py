import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

# Add supabase import if not present
if "import { supabase }" not in content:
    content = content.replace("import { WhiteLabelProposalBuilder }", "import { supabase } from '../../lib/supabase';\nimport { WhiteLabelProposalBuilder }")

# Change initial states to empty arrays
content = re.sub(r'const \[clients, setClients\] = useState<ClientProfile\[\]>\(INITIAL_CLIENTS\);', r'const [clients, setClients] = useState<ClientProfile[]>([]);', content)
content = re.sub(r'const \[deals, setDeals\] = useState<DealPipelineItem\[\]>\(INITIAL_DEALS\);', r'const [deals, setDeals] = useState<DealPipelineItem[]>([]);', content)
content = re.sub(r'const \[tasks, setTasks\] = useState<CRMTask\[\]>\(INITIAL_TASKS\);', r'const [tasks, setTasks] = useState<CRMTask[]>([]);', content)
content = re.sub(r'const \[newDealClient, setNewDealClient\] = useState\(INITIAL_CLIENTS\[0\]\.id\);', r'const [newDealClient, setNewDealClient] = useState("");', content)
content = re.sub(r'INITIAL_FLIGHT_HISTORY', r'history', content)

# Also define a history state
history_state = "const [history, setHistory] = useState<FlightHistoryRecord[]>([]);\n  const [isLoadingData, setIsLoadingData] = useState(true);"
if "const [history, setHistory]" not in content:
    content = content.replace("const [deals, setDeals]", f"const [deals, setDeals] = useState<DealPipelineItem[]>([]);\n  {history_state}")

# We need to add a useEffect to fetch data. Let's find where to insert it.
# Look for: const [searchQuery, setSearchQuery] = useState('');
use_effect_code = """
  useEffect(() => {
    async function fetchCRMData() {
      setIsLoadingData(true);
      try {
        const { data: clientsData, error: clientsErr } = await supabase.from('clients').select('*');
        if (!clientsErr && clientsData) {
          // Transform if needed, but assuming schema matches
          setClients(clientsData.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            email: c.email || '',
            phone: c.phone || '',
            preferences: c.preferences ? Object.values(c.preferences) : [],
            totalSpend: c.total_spend || 0,
            lastFlight: c.last_flight || undefined
          })));
        }

        const { data: proposalsData, error: propsErr } = await supabase.from('proposals').select('*');
        if (!propsErr && proposalsData) {
          setDeals(proposalsData.map(p => ({
            id: p.id,
            clientId: p.client_name, // fallback mapping
            clientName: p.client_name,
            route: p.flight_details?.route || 'TBD',
            date: p.flight_details?.date || 'TBD',
            value: p.total_price || 0,
            status: p.status === 'DRAFT' ? 'lead' : p.status === 'SENT' ? 'quoting' : p.status === 'ACCEPTED' ? 'won' : 'lost',
            probability: 50,
            lastContact: p.updated_at
          })));
        }
        
        const { data: historyData, error: histErr } = await supabase.from('flight_history').select('*');
        if (!histErr && historyData) {
          setHistory(historyData.map(h => ({
            id: h.id,
            clientName: 'Client', // Need join, simplified for now
            route: h.route,
            aircraft: h.aircraft,
            date: h.date,
            amount: h.amount,
            status: h.status
          })));
        }
      } catch (err) {
        console.error("Error fetching CRM data:", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchCRMData();
  }, []);
"""

content = content.replace("const [searchQuery, setSearchQuery] = useState('');", f"const [searchQuery, setSearchQuery] = useState('');\n{use_effect_code}")

# Fix fly.15dwings.com.ng link
content = content.replace('window.open("https://fly.15dwings.com.ng", "_blank");', 'window.open("https://fly.15dwings.com.ng", "_blank", "noopener,noreferrer");')

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)

print("Applied CRM workspace fixes")
