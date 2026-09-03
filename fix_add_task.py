import re

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'r') as f:
    content = f.read()

old_add_task = """  /* Add Task */
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    const task: CRMTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      dueDate: 'Today',
      priority: 'High',
      category: 'Follow Up',
      completed: false
    };
    setTasks(prev => [task, ...prev]);
    setNewTaskTitle('');
  };"""

new_add_task = """  /* Add Task */
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    
    // Optimistic UI update
    const tempId = `task-${Date.now()}`;
    const task: CRMTask = {
      id: tempId,
      title: newTaskTitle,
      dueDate: 'Today',
      priority: 'High',
      category: 'Follow Up',
      completed: false
    };
    setTasks(prev => [task, ...prev]);
    setNewTaskTitle('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const { data: brokerData } = await supabase.from('brokers').select('id').eq('auth_user_id', userData.user.id).single();
      if (!brokerData) return;

      const { data: newTask, error } = await supabase.from('tasks').insert({
        broker_id: brokerData.id,
        title: task.title,
        type: 'Task',
        status: 'pending'
      }).select().single();

      if (!error && newTask) {
        setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: newTask.id } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };"""

content = content.replace(old_add_task, new_add_task)

with open('src/components/broker/BrokerCRMWorkspace.tsx', 'w') as f:
    f.write(content)
