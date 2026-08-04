import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

export function ICCQuotePanel({ mission, onQuoteSent }: { mission: any, onQuoteSent?: () => void }) {
  const [baseCost, setBaseCost] = useState(mission?.estimated_lower || 45000);
  const [repositioningCost, setRepositioningCost] = useState(0);
  const [operatorAvailability, setOperatorAvailability] = useState('Available End of Week');
  const [isSending, setIsSending] = useState(false);

  const handleSendQuote = async () => {
    setIsSending(true);
    try {
      const quoteDetails = {
        baseCost,
        repositioningCost,
        operatorAvailability,
        totalQuote: baseCost + repositioningCost,
        sentAt: new Date().toISOString()
      };

      // Call our edge endpoint (proxy via Cloudflare / edge router pattern)
      // In development, this fetches to the local or remote worker.
      // (For this prototype, simulate calling the icc endpoint)
      const res = await fetch(`/api/icc/${mission.id}/quote/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteDetails)
      });
      
      // If we are in purely client-side mock preview, we won't throw on error 
      // but just pretend success for the demo.
      if (onQuoteSent) onQuoteSent();
    } catch (e) {
      console.warn("Edge cluster not deployed yet, using local fallback", e);
      if (onQuoteSent) onQuoteSent();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <h3 className="font-sans font-medium text-lg text-slate-800 mb-4">Prepare Final Quotation</h3>
      <p className="text-sm text-slate-500 mb-6">
        Compile the final quotation template based on operator responses. This will be transmitted immediately to the Client Portal.
      </p>

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Operator Availability</label>
          <input 
            type="text" 
            className="w-full border-slate-300 rounded-md shadow-sm sm:text-sm" 
            value={operatorAvailability}
            onChange={e => setOperatorAvailability(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Base Mission Cost (USD)</label>
          <input 
            type="number" 
            className="w-full border-slate-300 rounded-md shadow-sm sm:text-sm" 
            value={baseCost}
            onChange={e => setBaseCost(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Repositioning / Ferry Fees (USD)</label>
          <input 
            type="number" 
            className="w-full border-slate-300 rounded-md shadow-sm sm:text-sm" 
            value={repositioningCost}
            onChange={e => setRepositioningCost(Number(e.target.value))}
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500">Total Quotation</p>
            <p className="text-2xl font-mono text-slate-900">${(baseCost + repositioningCost).toLocaleString()}</p>
          </div>
          <button 
            disabled={isSending}
            onClick={handleSendQuote}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isSending ? 'Sending...' : 'Transmit Quote'}
          </button>
        </div>
      </div>
    </div>
  );
}
