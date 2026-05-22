import { useNavigate } from "react-router";
import { Heart, Star, TrendingDown, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useSavedPolicies } from "../saved-policies-context";
import { toast } from "sonner";

export function SavedPolicies() {
  const navigate = useNavigate();
  const { savedPolicies, removeSavedPolicy } = useSavedPolicies();

  const handleRemove = (policyId: number) => {
    removeSavedPolicy(policyId);
    toast.success("Policy removed from saved");
  };

  const handlePurchase = (policy: any) => {
    navigate("/dashboard/purchase", { state: { policy } });
  };

  if (savedPolicies.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <Heart className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-4">No Saved Policies Yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Save policies you're interested in to compare them later and make an informed decision
        </p>
        <button
          onClick={() => navigate("/dashboard/compare")}
          className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all"
        >
          Browse Policies
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved Policies</h1>
        <p className="text-muted-foreground">
          You have {savedPolicies.length} saved {savedPolicies.length === 1 ? "policy" : "policies"}
        </p>
      </div>

      <div className="space-y-6">
        {savedPolicies.map((policy, index) => (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border-2 border-border rounded-2xl p-6 hover:shadow-xl transition-all"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-5xl">{policy.logo}</div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">{policy.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{policy.provider}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="font-medium">{policy.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-64 flex flex-col justify-between">
                <div className="bg-accent/50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-muted-foreground mb-1">Premium</div>
                  <div className="text-2xl font-bold mb-3">{policy.premium}</div>
                  <div className="text-sm text-muted-foreground mb-1">Coverage</div>
                  <div className="text-lg font-semibold">{policy.coverage}</div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handlePurchase(policy)}
                    className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Purchase Now
                  </button>
                  <button
                    onClick={() => handleRemove(policy.id)}
                    className="w-full py-3 border border-destructive/50 text-destructive rounded-xl hover:bg-destructive/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
