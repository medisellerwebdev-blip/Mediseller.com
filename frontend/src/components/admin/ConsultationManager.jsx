import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { 
  Stethoscope, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Loader2,
  MessageSquare,
  WhatsappIcon
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ConsultationManager() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/consultations`, { credentials: 'include' });
      if (res.ok) {
        setConsultations(await res.json());
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/consultations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success(`Consultation marked as ${status}`);
        fetchConsultations();
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
          <h2 className="text-2xl font-bold font-heading text-slate-900">Expert Consultations</h2>
          <p className="text-slate-500 text-sm">Requests for medication advice and guidance</p>
        </div>
        <Badge variant="outline" className="bg-white">{consultations.length} Requests</Badge>
      </div>

      {consultations.length === 0 ? (
        <Card className="bg-slate-50 border-dashed">
          <CardContent className="p-12 text-center text-slate-500">
            <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-20" />
            No consultation requests found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {consultations.map((cons) => (
            <Card key={cons.consultation_id} className="overflow-hidden border-slate-200">
              <div className="flex">
                <div className={`w-1.5 ${cons.status === 'pending' ? 'bg-amber-400' : 'bg-green-500'}`} />
                <div className="flex-1 p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{cons.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          Requested {new Date(cons.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={cons.status === 'pending' ? "bg-amber-100 text-amber-700 border-0" : "bg-green-100 text-green-700 border-0"}>
                      {cons.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Contact Details</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-slate-600">
                          <Phone className="w-4 h-4 text-primary" />
                          <span className="text-sm">{cons.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <Mail className="w-4 h-4 text-primary" />
                          <span className="text-sm">{cons.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-green-600">W</span>
                          </div>
                          <span className="text-sm">Preferred: {cons.preferred_contact}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Medication Query</p>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-slate-700 text-sm italic leading-relaxed">
                          "{cons.medication_query}"
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    {cons.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateStatus(cons.consultation_id, 'completed')}
                        className="rounded-full bg-green-600 hover:bg-green-700 h-10 px-6"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark as Completed
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full h-10 px-6"
                      onClick={() => window.open(`https://wa.me/${cons.phone.replace(/\D/g,'')}`, '_blank')}
                    >
                      Contact via WhatsApp
                    </Button>
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
