import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'; // Assuming shadcn ui exist
import { Button } from './ui/button';
import { Input } from './ui/input';

export const MissionSettlementPanel: React.FC = () => {
  const [missionId, setMissionId] = useState('');
  const [email, setEmail] = useState('');
  const [mission, setMission] = useState<any>(null);
  const [margin, setMargin] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchMission = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('id', missionId)
        .single();
      
      if (error) throw error;
      setMission(data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch mission details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mission Settlement Engine</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Mission ID" value={missionId} onChange={(e) => setMissionId(e.target.value)} />
        <Input placeholder="Broker Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button onClick={fetchMission} disabled={loading}>Fetch Mission Details</Button>
        
        {mission && (
          <div className="space-y-2 mt-4 p-4 border rounded">
            <p><strong>Mission ID:</strong> {mission.id}</p>
            <p><strong>Wholesale Quote:</strong> ${mission.gross_operator_quote}</p>
            <Input type="number" placeholder="Margin (%)" value={margin} onChange={(e) => setMargin(Number(e.target.value))} />
            <p><strong>Total Flight Amount (Settled):</strong> ${(mission.gross_operator_quote * (1 + margin / 100)).toFixed(2)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
