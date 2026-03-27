import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Mail, Calendar, Hash, 
  MoreVertical, ShieldCheck, ShieldAlert,
  Loader2, UserPlus, Filter, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchUsers();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Customer Management</h2>
          <p className="text-slate-500 text-sm">View and manage your registered user base</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="hidden md:flex">
             <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
            Total Users: {users.length}
          </Badge>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-0 pt-6 px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-10 h-10 border-slate-200 focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-y border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-center">Orders</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{user.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-slate-600">
                        <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-slate-500">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-2.5">
                        {user.order_count || 0}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={user.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {user.active !== false ? 'Active' : 'Blocked'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 text-slate-400 hover:text-primary transition-colors"
                           onClick={() => toggleStatus(user.user_id, user.active !== false)}
                         >
                           {user.active !== false ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                         </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                           <MoreVertical className="w-4 h-4" />
                         </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Users className="w-10 h-10 text-slate-200 mb-2" />
                        <p className="text-slate-500">No users found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManager;
