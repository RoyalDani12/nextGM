import { Link } from "react-router-dom";

export default function VerifyEmailNotice() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-3">Check your email</h1>
                <p className="text-sm text-slate-500 mb-6">
                    We sent a verification link to your inbox. Click it to activate your account.
                </p>
                <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}