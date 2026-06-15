import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { businessApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, Copy, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const BusinessApiKeys: React.FC = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['business', 'keys'],
    queryFn: businessApi.getApiKeys,
  });

  const apiKeys = data?.data || [];

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await businessApi.createApiKey(newKeyName.trim());
      setCreatedKey(res.data?.key || null);
      qc.invalidateQueries({ queryKey: ['business', 'keys'] });
      toast({ title: 'Key created', description: 'Copy it now — won\'t be shown again.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally { setCreating(false); }
  };

  const handleRevoke = async (id: string) => {
    try {
      await businessApi.revokeApiKey(id);
      qc.invalidateQueries({ queryKey: ['business', 'keys'] });
      toast({ title: 'Key revoked' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    }
  };

  return (
    <BusinessLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">API Keys</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your API keys for programmatic access</p>
          </div>
          <Button size="sm" onClick={() => { setDialogOpen(true); setCreatedKey(null); setNewKeyName(''); }} className="bg-yellow-500 hover:bg-yellow-600 text-zinc-900">
            <Plus className="h-4 w-4 mr-1" /> New Key
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : apiKeys.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No API keys created yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 border-b">
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Key Prefix</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Last Used</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((key: any) => (
                    <tr key={key.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{key.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{key.keyPrefix}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${key.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {key.isActive ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {key.isActive && (
                          <button onClick={() => handleRevoke(key.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Revoke key">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{createdKey ? 'API Key Created' : 'Create API Key'}</DialogTitle></DialogHeader>
          {createdKey ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <code className="block bg-white rounded p-2 text-xs font-mono break-all border">{createdKey}</code>
                <p className="text-xs text-yellow-700 mt-2">Copy this now. You won't see it again!</p>
              </div>
              <Button size="sm" className="w-full" onClick={() => { navigator.clipboard.writeText(createdKey); toast({ title: 'Copied!' }); }}>Copy Key</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Key Name</Label>
                <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production API Key" />
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button size="sm" disabled={creating || !newKeyName.trim()} className="bg-yellow-500 hover:bg-yellow-600 text-zinc-900" onClick={handleCreate}>
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null} Generate
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </BusinessLayout>
  );
};

export default BusinessApiKeys;