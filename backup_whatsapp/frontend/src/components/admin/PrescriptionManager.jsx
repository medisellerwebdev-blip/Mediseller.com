import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { 
  FileText, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Eye, 
  Loader2,
  FileCheck
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function PrescriptionManager() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/prescriptions`, { credentials: 'include' });
      if (res.ok) {
        setPrescriptions(await res.json());
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/prescriptions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success(`Prescription ${status}`);
        fetchPrescriptions();
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
          <h2 className="text-2xl font-bold font-heading text-slate-900">Medical Prescriptions</h2>
          <p className="text-slate-500 text-sm">Review clinical documents uploaded by customers</p>
        </div>
        <Badge variant="outline" className="bg-white">{prescriptions.length} Documents</Badge>
      </div>

      {prescriptions.length === 0 ? (
        <Card className="bg-slate-50 border-dashed">
          <CardContent className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            No prescriptions found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.map((px) => (
            <Card key={px.prescription_id} className="overflow-hidden border-slate-200 hover:shadow-lg transition-shadow bg-white">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 truncate max-w-[150px]">{px.file_name}</h3>
                      <p className="text-xs text-slate-400 capitalize">{px.file_type.split('/')[1] || 'Document'}</p>
                    </div>
                  </div>
                  <Badge className={px.status === 'pending' ? 'bg-amber-100 text-amber-700' : (px.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                    {px.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{px.guest_email || 'Registered User'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Clock className="w-4 h-4 text-slate-300" />
                    <span>Uploaded {new Date(px.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="aspect-video bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center mb-6 overflow-hidden relative group">
                  {px.file_data && px.file_type.startsWith('image/') ? (
                    <>
                      <img src={px.file_data} alt="Prescription" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button size="sm" variant="secondary" onClick={() => setViewingImage(px.file_data)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Full
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">PDF or Document</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 rounded-lg h-10"
                    onClick={() => {
                        const link = document.createElement('a');
                        link.href = px.file_data;
                        link.download = px.file_name;
                        link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  {px.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 rounded-lg h-10"
                        onClick={() => updateStatus(px.prescription_id, 'approved')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="rounded-lg h-10"
                        onClick={() => updateStatus(px.prescription_id, 'rejected')}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4" onClick={() => setViewingImage(null)}>
          <div className="max-w-4xl max-h-[90vh] relative">
            <img src={viewingImage} alt="Full Resolution" className="w-full h-full object-contain" />
            <Button className="absolute top-[-2rem] right-0 text-white" variant="ghost" onClick={() => setViewingImage(null)}>
               CLOSE
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
