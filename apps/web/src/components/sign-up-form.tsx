import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Label } from "@reurci/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const navigate = useNavigate({
    from: "/",
  });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: () => {
            navigate({
              to: "/dashboard",
            });
            toast.success("Sign up successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative z-10">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[var(--color-peach-wash)] via-[var(--color-mint-wash)] to-[var(--color-sky-wash)] opacity-30 blur-[80px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="w-full max-w-[420px] bg-white p-8 sm:p-10 rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-gray-100/80 relative z-20">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-sky-wash)] text-[#08304c] mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-heading)", color: "var(--color-portrait-ink)" }}>
            Create Account
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: "var(--color-slate-helper)" }}>
            Join us to tailor your CV perfectly
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-5"
        >
          <div>
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="text-xs font-semibold uppercase tracking-wider text-gray-500">Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-11 rounded-[14px] bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-red-500 text-xs mt-1">
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <div>
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="text-xs font-semibold uppercase tracking-wider text-gray-500">Email</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-11 rounded-[14px] bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-red-500 text-xs mt-1">
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <div>
            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="text-xs font-semibold uppercase tracking-wider text-gray-500">Password</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-11 rounded-[14px] bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-red-500 text-xs mt-1">
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <div className="pt-2">
            <form.Subscribe
              selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button type="submit" variant="rainbow" className="w-full h-12 text-[15px] font-semibold" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Sign Up"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>

        <div className="mt-8 text-center text-[14.5px]">
          <span style={{ color: "var(--color-slate-helper)" }}>Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="font-medium hover:underline underline-offset-4 transition-all"
            style={{ color: "var(--color-portrait-ink)" }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
