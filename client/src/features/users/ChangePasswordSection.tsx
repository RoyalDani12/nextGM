import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordSchema, type ChangePasswordFormValues } from "./user.schema";
import { useChangePassword } from "./users.hook";

type PasswordFieldProps = {
  label: string;
  name: keyof ChangePasswordFormValues;
  register: ReturnType<typeof useForm<ChangePasswordFormValues>>["register"];
  error?: string;
  placeholder: string;
};

function PasswordField({ label, name, register, error, placeholder }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>
      <span className="relative block">
        <LockKeyhole className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-400" />
        <Input
          {...register(name)}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={name === "oldPassword" ? "current-password" : "new-password"}
          className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-11 text-sm focus-visible:border-orange-400 focus-visible:ring-orange-100"
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
      {error && <span className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export default function ChangePasswordSection() {
  const navigate = useNavigate();
  const changePassword = useChangePassword();
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });
  const errorMessage = isAxiosError(changePassword.error)
    ? changePassword.error.response?.data?.message
    : changePassword.error instanceof Error
      ? changePassword.error.message
      : null;

  const onSubmit = (values: ChangePasswordFormValues) => {
    setSubmitted(false);
    changePassword.mutate(values, {
      onSuccess: () => {
        setSubmitted(true);
        window.setTimeout(() => navigate("/login", { replace: true }), 1400);
      },
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_250px]">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {submitted && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div><p className="font-bold">Password changed successfully.</p><p className="mt-1 text-xs">For your security, you are being signed out. Please log in again.</p></div>
          </div>
        )}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p className="font-medium">{typeof errorMessage === "string" ? errorMessage : "We could not change your password."}</p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField label="Current password" name="oldPassword" register={form.register} error={form.formState.errors.oldPassword?.message} placeholder="Enter current password" />
          <div className="hidden sm:block" />
          <PasswordField label="New password" name="newPassword" register={form.register} error={form.formState.errors.newPassword?.message} placeholder="Create a stronger password" />
          <PasswordField label="Confirm new password" name="confirmPassword" register={form.register} error={form.formState.errors.confirmPassword?.message} placeholder="Repeat new password" />
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">Changing your password signs out all other devices.</p>
          <Button type="submit" disabled={changePassword.isPending} className="h-11 rounded-xl bg-slate-950 px-5 font-bold text-white hover:bg-orange-600">
            {changePassword.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
            {changePassword.isPending ? "Updating..." : "Update password"}
          </Button>
        </div>
      </form>
      <aside className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-slate-50 p-4">
        <KeyRound className="size-5 text-orange-600" />
        <h3 className="mt-3 text-sm font-extrabold text-slate-900">Make it hard to guess</h3>
        <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
          <li>Use at least 8 characters.</li>
          <li>Mix uppercase and lowercase letters.</li>
          <li>Add a number and special character.</li>
          <li>Do not reuse your current password.</li>
        </ul>
      </aside>
    </div>
  );
}
