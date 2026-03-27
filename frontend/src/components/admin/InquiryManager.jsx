import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { 
  Mail, 
  MessageSquare, 
  User, 
  Clock, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Phone
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function InquiryManager() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/inquiries`, { credentials: 'include' });
      if (res.ok) {
        setInquiries(await res.json());
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/inquiries/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success(`Inquiry marked as ${status}`);
        fetchInquiries();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900">Customer Inquiries</h2>
          <p className="text-slate-500 text-sm">Messages received from the contact forms</p>
        </div>
        <Badge variant="outline" className="bg-white">{inquiries.length} Messages</Badge>
      </div>

      {inquiries.length === 0 ? (
        <Card className="bg-slate-50 border-dashed">
          <CardContent className="p-12 text-center text-slate-500">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
            No inquiries found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {inquiries.map((inq) => (
            <Card key={inq.inquiry_id} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className={`w-1.5 ${inq.status === 'new' ? 'bg-primary' : (inq.status === 'replied' ? 'bg-green-500' : 'bg-slate-300')}`} />
                <div className="flex-1 p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{inq.name}</span>
                        {inq.status === 'new' && <Badge className="bg-primary text-white text-[10px] animate-pulse">New Message</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {inq.email}</span>
                        {inq.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {inq.phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(inq.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                    <p className="font-semibold text-slate-700 text-sm mb-1">{inq.subject}</p>
                    <p className="text-slate-600 text-[13px] leading-relaxed italic">"{inq.message}"</p>
                  </div>

                  <div className="flex justify-between items-center bg-white border-t p-4 mx-[-1.5rem] mb-[-1.5rem]">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant={inq.status === 'replied' ? 'default' : 'outline'}
                        className="rounded-full h-8 text-xs"
                        onClick={() => updateStatus(inq.inquiry_id, 'replied')}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Mark as Replied
                      </Button>
                      <Button 
                        size="sm" 
                        variant={inq.status === 'closed' ? 'secondary' : 'outline'}
                        className="rounded-full h-8 text-xs"
                        onClick={() => updateStatus(inq.inquiry_id, 'closed')}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Close Inquiry
                      </Button>
                    </div>
                    <a href={`mailto:${inq.email}`} className="text-primary text-xs font-bold hover:underline">
                      Send Email Directly
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
