import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

# Let's replace the inline toggle with a function call
old_toggle = """setTasks(prev =>
                        prev.map(t => (t.id === task.id ? { ...t, completed: !t.completed } : t))
                      )"""

new_toggle = """{
                      const newStatus = !task.completed;
                      setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, completed: newStatus } : t)));
                      supabase.from('tasks').update({ status: newStatus ? 'completed' : 'pending' }).eq('id', task.id).then();
                    }"""

content = content.replace(old_toggle, new_toggle)

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)
