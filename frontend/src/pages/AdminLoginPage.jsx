import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Lock, Mail, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Request, 2: Reset
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        toast.success('Admin login successful');
        navigate('/admin/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/forgot-password`, { method: 'POST' });
      if (res.ok) {
        toast.success('Verification code sent to medisellerwebdev@gmail.com');
        setResetStep(2);
      } else {
        toast.error('Failed to send reset code');
      }
    } catch (err) {
      toast.error('Connection error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: resetCode, new_password: newPassword })
      });
      if (res.ok) {
        toast.success('Password reset successfully. Please login.');
        setShowForgot(false);
        setResetStep(1);
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Invalid code or request');
      }
    } catch (err) {
      toast.error('Connection error');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold font-heading">
            {showForgot ? 'Reset Admin Password' : 'Admin Portal'}
          </CardTitle>
          <CardDescription>
            {showForgot 
              ? (resetStep === 1 ? 'Request a verification code' : 'Enter the code sent to your email')
              : 'Enter your credentials to manage Mediseller 2.0'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showForgot ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@mediseller.com"
                    className="pl-10 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <button 
                    type="button" 
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-full h-11" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={resetStep === 1 ? handleForgotRequest : handleResetSubmit} className="space-y-4">
              {resetStep === 1 ? (
                <>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mb-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Verification code will be sent to the registered development email:
                      <span className="block font-semibold text-primary mt-1">medisellerwebdev@gmail.com</span>
                    </p>
                  </div>
                  <Button type="submit" className="w-full rounded-full h-11" disabled={resetLoading}>
                    {resetLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Send Verification Code
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      placeholder="000000"
                      className="text-center tracking-widest text-lg font-bold rounded-xl"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new secure password"
                      className="rounded-xl"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-full h-11" disabled={resetLoading}>
                    {resetLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Reset Password
                  </Button>
                </>
              )}
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full rounded-full" 
                onClick={() => { setShowForgot(false); setResetStep(1); }}
              >
                Back to Login
              </Button>
            </form>
          )}
          <div className="mt-6 text-center text-sm text-slate-500">
            <p>Protected Management Interface</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
