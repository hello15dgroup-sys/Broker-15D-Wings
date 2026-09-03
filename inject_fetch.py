import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

use_effect_code = """
  useEffect(() => {
    async function fetchCRMData() {
      setIsLoadingData(true);
      try {
        const { data: clientsData, error: clientsErr } = await supabase.from('clients').select('*');
        if (!clientsErr && clientsData) {
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
            clientId: p.client_name,
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
            clientName: 'Client',
            route: h.route,
            aircraft: h.aircraft,
            date: h.date,
            amount: h.amount,
            status: h.status
          })));
        }

        const { data: tasksData, error: tasksErr } = await supabase.from('tasks').select('*').order('due_date', { ascending: true });
        if (!tasksErr && tasksData) {
          setTasks(tasksData.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            type: t.type === 'Call' ? 'call' : t.type === 'Follow-up' ? 'followup' : 'email',
            status: t.status === 'completed' ? 'completed' : 'pending',
            dueDate: t.due_date || t.created_at,
            priority: 'high' // Default
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

content = content.replace("const [tasks, setTasks] = useState<CRMTask[]>([]);", f"const [tasks, setTasks] = useState<CRMTask[]>([]);\n{use_effect_code}")

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)

