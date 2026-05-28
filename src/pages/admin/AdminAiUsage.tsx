import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, AiUsageSummary } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, History } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const AdminAiUsage: React.FC = () => {
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AiUsageSummary | null>(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "ai-usage"],
    queryFn: adminApi.getAiUsageSummary,
    retry: false,
  });

  const users: AiUsageSummary[] = data?.data || [];

  const adjustMutation = useMutation({
    mutationFn: ({ userId, amount }: { userId: string; amount: number }) => adminApi.adjustAiCredits(userId, amount),
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ["admin", "ai-usage"] });
      toast({ title: "Credits updated", description: response.message });
      setCreditDialogOpen(false);
      setCreditAmount("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update credits", variant: "destructive" });
    },
  });

  const copyUserId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast({ title: "UUID copied" });
    } catch {
      toast({ title: "Failed to copy UUID", variant: "destructive" });
    }
  };

  const openAdjustDialog = (user: AiUsageSummary) => {
    setSelectedUser(user);
    setCreditAmount("");
    setCreditDialogOpen(true);
  };

  const openHistoryDialog = (user: AiUsageSummary) => {
    setSelectedUser(user);
    setHistoryDialogOpen(true);
  };

  const handleAdjust = () => {
    if (!selectedUser) return;
    const amount = parseInt(creditAmount, 10);
    if (!amount) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    adjustMutation.mutate({ userId: selectedUser.id, amount });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Usage</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monitor credit usage and try-on activity</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading usage...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No AI usage yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">UUID</th>
                    <th className="text-left px-4 py-3 font-medium">Credits</th>
                    <th className="text-left px-4 py-3 font-medium">Try-ons</th>
                    <th className="text-left px-4 py-3 font-medium">Success Rate</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.id}
                      className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${idx % 2 ? 'bg-gray-50/40 dark:bg-gray-800/20' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{user.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[220px]">
                          <span className="font-mono text-[11px] text-gray-600 dark:text-gray-300 break-all">
                            {user.id}
                          </span>
                          <button
                            onClick={() => copyUserId(user.id)}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                            title="Copy UUID"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {user.aiCredits}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-semibold">{user.aiTryOnCount}</span>
                          <span className="text-xs text-gray-400">of {user.totalTryOns} attempts</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {user.totalTryOns === 0 ? "—" : `${user.successRate}%`}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openHistoryDialog(user)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => openAdjustDialog(user)}>Adjust</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust AI Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {selectedUser?.name} ({selectedUser?.email})
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credit-amount">Amount (use negative to deduct)</Label>
              <Input
                id="credit-amount"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="e.g. 5 or -3"
              />
            </div>
            <Button onClick={handleAdjust} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                "Update credits"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Credit Purchase History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {(selectedUser?.purchases || []).length === 0 ? (
              <div className="text-muted-foreground">No purchases yet.</div>
            ) : (
              <div className="space-y-2">
                {(selectedUser?.purchases || []).map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between border border-border/60 rounded-lg px-3 py-2">
                    <div>
                      <div className="font-medium">{purchase.credits} credits</div>
                      <div className="text-xs text-muted-foreground">₹{(purchase.amountInPaise / 100).toLocaleString("en-IN")}</div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <div className="uppercase">{purchase.status}</div>
                      <div>{new Date(purchase.createdAt).toLocaleDateString("en-IN")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAiUsage;
