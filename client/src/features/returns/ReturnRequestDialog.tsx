import { useState } from "react";
import { ImagePlus, Loader2, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { getUploadSignatureRequest, uploadToCloudinary } from "../upload/upload.api";
import { useCreateReturnRequest, useUpdateReturnEvidence } from "./return.hooks";
import type { ReturnReason, ReturnResolution } from "./return.types";

interface ReturnOrderItem {
  id: string;
  quantity: number;
  unitPrice: number | string;
  product?: { name?: string; images?: Array<{ url: string }> };
  variant?: { name?: string } | null;
}

interface ReturnRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  items: ReturnOrderItem[];
  onSubmitted?: () => void;
}

const reasons: Array<{ value: ReturnReason; label: string }> = [
  { value: "DAMAGED", label: "Item arrived damaged" },
  { value: "WRONG_ITEM", label: "I received the wrong item" },
  { value: "MISSING_ITEM", label: "Something is missing" },
  { value: "NOT_AS_DESCRIBED", label: "Not as described" },
  { value: "QUALITY_ISSUE", label: "Quality issue" },
  { value: "CHANGED_MIND", label: "Changed my mind" },
  { value: "OTHER", label: "Other reason" },
];

export function ReturnRequestDialog({
  open,
  onOpenChange,
  orderId,
  items,
  onSubmitted,
}: ReturnRequestDialogProps) {
  const createReturn = useCreateReturnRequest();
  const updateEvidence = useUpdateReturnEvidence();
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReturnReason>("DAMAGED");
  const [resolution, setResolution] = useState<ReturnResolution>("REFUND");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const toggleItem = (item: ReturnOrderItem) => {
    setSelected((current) => {
      if (current[item.id]) {
        const next = { ...current };
        delete next[item.id];
        return next;
      }
      return { ...current, [item.id]: 1 };
    });
  };

  const submit = async () => {
    const selectedItems = Object.entries(selected).map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (!selectedItems.length) {
      toast.add({ title: "Select an item", description: "Choose at least one item to return.", type: "error" });
      return;
    }

    try {
      const request = await createReturn.mutateAsync({
        orderId,
        reason,
        resolution,
        customerNote: note.trim() || undefined,
        items: selectedItems,
      });

      if (files.length) {
        const urls = [];
        for (const file of files) {
          const signature = await getUploadSignatureRequest("return_evidence", request.id, file.type);
          const upload = await uploadToCloudinary(file, signature);
          urls.push(upload.secure_url as string);
        }
        await updateEvidence.mutateAsync({ returnId: request.id, evidenceUrls: urls });
      }

      toast.add({
        title: "Return request submitted",
        description: "We will review your request and keep you updated.",
        type: "success",
      });
      setSelected({});
      setFiles([]);
      setNote("");
      onOpenChange(false);
      onSubmitted?.();
    } catch (error) {
      toast.add({
        title: "Could not submit return",
        description: error instanceof Error ? error.message : "Please try again.",
        type: "error",
      });
    }
  };

  const isSubmitting = createReturn.isPending || updateEvidence.isPending;

  return (
    <Dialog open={open} onOpenChange={(value) => !isSubmitting && onOpenChange(value)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-slate-200 p-0 sm:max-w-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-br from-orange-50 to-white px-6 py-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-slate-950">
              <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                <RotateCcw className="size-4" />
              </span>
              Start a return
            </DialogTitle>
            <DialogDescription className="max-w-lg text-sm leading-6 text-slate-600">
              Tell us what went wrong. You can request a refund or replacement for delivered items.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">1. Select items</p>
            <div className="space-y-2">
              {items.map((item) => {
                const isSelected = Boolean(selected[item.id]);
                return (
                  <div key={item.id} className={`flex items-center gap-3 rounded-2xl border p-3 transition ${isSelected ? "border-orange-300 bg-orange-50/60" : "border-slate-200"}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item)} className="size-4 accent-orange-500" />
                    <div className="size-12 overflow-hidden rounded-xl bg-slate-100">
                      {item.product?.images?.[0]?.url && <img src={item.product.images[0].url} alt="" className="size-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{item.product?.name || "Order item"}</p>
                      <p className="text-xs text-slate-500">{item.variant?.name ? `${item.variant.name} · ` : ""}Qty purchased: {item.quantity}</p>
                    </div>
                    {isSelected && (
                      <select
                        value={selected[item.id]}
                        onChange={(event) => setSelected((current) => ({ ...current, [item.id]: Number(event.target.value) }))}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"
                        aria-label="Return quantity"
                      >
                        {Array.from({ length: item.quantity }, (_, index) => index + 1).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">2. Reason</span>
              <select value={reason} onChange={(event) => setReason(event.target.value as ReturnReason)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-orange-400">
                {reasons.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <fieldset className="space-y-2 text-sm font-semibold text-slate-700">
              <legend className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">3. Preferred resolution</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["REFUND", "REPLACEMENT"] as const).map((option) => (
                  <label key={option} className={`cursor-pointer rounded-xl border p-3 text-center text-xs transition ${resolution === option ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600"}`}>
                    <input type="radio" name="resolution" value={option} checked={resolution === option} onChange={() => setResolution(option)} className="sr-only" />
                    {option === "REFUND" ? "Refund" : "Replacement"}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <label className="block space-y-2 text-sm font-semibold text-slate-700">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">4. Add details <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span></span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={3} placeholder="Share anything that will help us understand the issue..." className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 hover:border-orange-400 hover:bg-orange-50/40">
            <ImagePlus className="size-5 text-orange-500" />
            <span className="flex-1"><strong className="text-slate-900">Add photos</strong><br /><span className="text-xs">Up to 5 JPG, PNG, or WEBP images</span></span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))} />
            {files.length > 0 && <span className="text-xs font-bold text-orange-600">{files.length} selected</span>}
          </label>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Not now</button>
            <button type="button" onClick={submit} disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:opacity-50">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Submit return request
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
