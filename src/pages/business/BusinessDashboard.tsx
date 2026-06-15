import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { businessApi } from '@/services/api';
import { Loader2, Zap, BarChart3, Key, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BusinessDashboard: React.FC = () => {
  const { toast } = useToast();
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: creditsData, isLoading: creditsLoading } = useQuery({
    queryKey: ['business', 'credits'],
    queryFn: businessApi.getCredits,
    refetchInterval: 30_000,
  });

  const { data: keysData, isLoading: keysLoading, refetch: refetchKeys } = useQuery({
    queryKey: ['business', 'keys'],
    queryFn: businessApi.getApiKeys,
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['business', 'usage'],
    queryFn: () => businessApi.getUsage({ limit: 10 }),
  });

  const credits = creditsData?.data;
  const apiKeys = keysData?.data || [];
  const usageItems = usageData?.data?.items || [];

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await businessApi.createApiKey(newKeyName.trim());
      setCreatedKey(res.data?.key || null);
      await refetchKeys();
      toast({ title: 'API key created', description: 'Copy it now — it won\'t be shown again.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create key', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await businessApi.revokeApiKey(id);
      await refetchKeys();
      toast({ title: 'API key revoked' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to revoke', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <BusinessLayout>
      <div className="p-6 space-y-6">
        {/* Credit card */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 text-zinc-900">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Credit Balance</span>
          </div>
          {creditsLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <p className="text-4xl font-bold mb-1">{credits?.credits ?? 0}</p>
              <p className="text-sm opacity-80">Cost per try-on: {credits?.costPerTask ?? 1} credit</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Keys */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Key className="h-4 w-4" /> API Keys
              </h2>
              <Button size="sm" onClick={() => { setKeyDialogOpen(true); setCreatedKey(null); setNewKeyName(''); }} className="bg-yellow-500 hover:bg-yellow-600 text-zinc-900">
                + New Key
              </Button>
            </div>
            {keysLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : apiKeys.length === 0 ? (
              <p className="text-sm text-gray-400">No API keys yet.</p>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((key: any) => (
                  <div key={key.id} className={`flex items-center justify-between p-3 rounded-lg border text-sm ${key.isActive ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 bg-red-50 dark:bg-red-900/10'}`}>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{key.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{key.keyPrefix}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyToClipboard(key.keyPrefix)} className="text-gray-400 hover:text-gray-600 p-1">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {key.isActive && (
                        <button onClick={() => handleRevoke(key.id)} className="text-xs text-red-500 hover:text-red-700">Revoke</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Usage */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4" /> Recent Usage
            </h2>
            {usageLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : usageItems.length === 0 ? (
              <p className="text-sm text-gray-400">No usage yet.</p>
            ) : (
              <div className="space-y-2">
                {usageItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.success === null ? 'bg-yellow-400' : item.success ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-xs font-mono text-gray-500">{item.taskId.slice(0, 12)}...</span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Key Dialog */}
      <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create API Key</DialogTitle></DialogHeader>
          {createdKey ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-yellow-800 mb-1">Your API Key</p>
                <code className="block bg-white rounded p-2 text-xs font-mono break-all border">{createdKey}</code>
                <p className="text-xs text-yellow-700 mt-2">Copy this key now. You won't be able to see it again!</p>
              </div>
              <Button size="sm" className="w-full" onClick={() => { copyToClipboard(createdKey); }}>Copy Key</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Key Name</Label>
                <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production" />
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setKeyDialogOpen(false)}>Cancel</Button>
                <Button size="sm" disabled={creating || !newKeyName.trim()} className="bg-yellow-500 hover:bg-yellow-600 text-zinc-900" onClick={handleCreateKey}>
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Generate Key
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </BusinessLayout>
  );
};

export default BusinessDashboard;