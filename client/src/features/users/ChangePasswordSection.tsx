import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
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
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-700 block">{label}</label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-slate-400" />
        <Input
          {...register(name)}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={name === "oldPassword" ? "current-password" : "new-password"}
          className="h-9 rounded-md border-slate-200 bg-white pl-9 pr-9 text-xs focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500/20"
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1.5 rounded p-1 text-slate-400 transition hover:text-slate-700 cursor-pointer"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
      {error && <p className="text-[11px] font-medium text-rose-600 mt-1">{error}</p>}
    </div>
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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {submitted && (
          <div className="flex items-start gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Password changed successfully.</p>
              <p className="mt-0.5 text-[11px] text-emerald-700">For security, you are being signed out. Please sign in again with your new password.</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p className="font-medium">{typeof errorMessage === "string" ? errorMessage : "Could not update password. Please check your current password."}</p>
          </div>
        )}

        <div className="space-y-4">
          <PasswordField
            label="Current password"
            name="oldPassword"
            register={form.register}
            error={form.formState.errors.oldPassword?.message}
            placeholder="••••••••••••"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              label="New password"
              name="newPassword"
              register={form.register}
              error={form.formState.errors.newPassword?.message}
              placeholder="••••••••••••"
            />
            <PasswordField
              label="Confirm new password"
              name="confirmPassword"
              register={form.register}
              error={form.formState.errors.confirmPassword?.message}
              placeholder="••••••••••••"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-400">
            Updating your password terminates all other active sessions.
          </p>
          <Button
            type="submit"
            disabled={changePassword.isPending}
            className="h-8.5 rounded-md bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {changePassword.isPending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <KeyRound className="mr-1.5 size-3.5" />}
            {changePassword.isPending ? "Updating..." : "Update password"}
          </Button>
        </div>
      </form>

      {/* Password Requirements Guide */}
      <aside className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 self-start">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
          <ShieldCheck className="size-4 text-slate-600" />
          <span>Security Checklist</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Your new password must meet the following criteria:
        </p>
        <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
          <li className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-slate-400" />
            At least 8 characters
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-slate-400" />
            Uppercase & lowercase letters
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-slate-400" />
            At least one numeric digit (0-9)
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-slate-400" />
            At least one special character
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-slate-400" />
            Different from current password
          </li>
        </ul>
      </aside>
    </div>
  );
}
