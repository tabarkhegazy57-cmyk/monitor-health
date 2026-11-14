import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MOOD_LABELS } from "@/data/indicators";
import { useSession } from "@/features/auth/use-session";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { keys } from "@/services/queries";
import { validateReadingInput } from "@/services/validation";
import type { IndicatorDefinition, NewReadingInput } from "@/types/domain";

export function LogReadingDialog({ def }: { def: IndicatorDefinition }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [secondary, setSecondary] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setValue("");
    setSecondary("");
    setNote("");
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: (input: NewReadingInput) =>
      api.health.addReading(session.token, def.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.health(session) });
      toast.success(`${def.name} entry saved`, { description: "Stored for this demo session only." });
      reset();
      setOpen(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input: NewReadingInput = {
      value: value.trim() === "" ? NaN : Number(value),
      secondary: def.valueKind === "pressure" ? (secondary.trim() === "" ? NaN : Number(secondary)) : undefined,
      note: note.trim() || undefined,
    };
    const problem = validateReadingInput(def, input);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    mutation.mutate(input);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus /> Log entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle className="font-display">Log {def.name.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Manual entries are kept only for this browser session in the prototype and are marked as manual.
            </DialogDescription>
          </DialogHeader>

          <div className="my-5 space-y-4">
            {def.valueKind === "scale" ? (
              <fieldset>
                <legend className="mb-2 text-sm font-medium">How are you feeling?</legend>
                <div className="grid grid-cols-5 gap-2" role="radiogroup">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={value === String(n)}
                      onClick={() => setValue(String(n))}
                      className={cn(
                        "flex flex-col items-center rounded-md border px-1 py-2.5 text-xs transition-colors",
                        value === String(n)
                          ? "border-primary bg-accent text-accent-foreground"
                          : "hover:border-ring/50 hover:bg-surface",
                      )}
                    >
                      <span className="font-mono text-lg">{n}</span>
                      <span className="mt-0.5 text-muted-foreground">{MOOD_LABELS[n]}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : def.valueKind === "pressure" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sys">Systolic (mmHg)</Label>
                  <Input id="sys" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 118" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dia">Diastolic (mmHg)</Label>
                  <Input id="dia" inputMode="numeric" value={secondary} onChange={(e) => setSecondary(e.target.value)} placeholder="e.g. 76" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="val">
                  {def.name} {def.unit ? `(${def.unit})` : ""}
                </Label>
                <Input id="val" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={220} placeholder="Context for this entry" />
            </div>
            {error && (
              <p role="alert" className="rounded-md bg-coral-soft px-3 py-2 text-sm text-coral-ink">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" />}
              Save entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
