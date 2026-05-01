import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Edit3, Eye, 
  Calendar, User, Image as ImageIcon, 
  Loader2, Save, X, ExternalLink,
  Search, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const BlogManager = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    author: 'MediSeller Team',
    image_url: '',
    tags: [],
    published: true
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/blog`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      toast.error("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentPost.title || !currentPost.content) {
      toast.error("Title and Content are required");
      return;
    }

    // Auto-generate slug if empty
    if (!currentPost.slug) {
      currentPost.slug = currentPost.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPost),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success("Post saved successfully");
        setIsEditing(false);
        fetchPosts();
      }
    } catch (error) {
      toast.error("Save failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/blog/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success("Post deleted");
        fetchPosts();
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (isEditing) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" /> Save Article
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200">
                 <CardHeader>
                    <CardTitle>Article Content</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-500">Post Title</label>
                       <Input 
                        placeholder="Enter catchy headline..." 
                        value={currentPost.title}
                        onChange={(e) => setCurrentPost({...currentPost, title: e.target.value})}
                        className="text-lg font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-500">Short Summary</label>
                       <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        placeholder="Brief overview of the article..."
                        value={currentPost.summary}
                        onChange={(e) => setCurrentPost({...currentPost, summary: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-500">Full Content (HTML/Markdown supported)</label>
                       <textarea 
                        className="flex min-h-[400px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
                        placeholder="Start writing..."
                        value={currentPost.content}
                        onChange={(e) => setCurrentPost({...currentPost, content: e.target.value})}
                       />
                    </div>
                 </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="border-slate-200">
                 <CardHeader><CardTitle className="text-sm">Publishing Info</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-500">Author</label>
                       <Input value={currentPost.author} onChange={(e) => setCurrentPost({...currentPost, author: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-500">Slug</label>
                       <Input value={currentPost.slug} placeholder="url-friendly-slug" onChange={(e) => setCurrentPost({...currentPost, slug: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-slate-500">Featured Image URL</label>
                       <Input value={currentPost.image_url} placeholder="https://..." onChange={(e) => setCurrentPost({...currentPost, image_url: e.target.value})} />
                       {currentPost.image_url && (
                         <div className="mt-2 aspect-video rounded-lg overflow-hidden border">
                            <img src={currentPost.image_url} alt="Preview" className="w-full h-full object-cover" />
                         </div>
                       )}
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-800">Health Blog CMS</h2>
          <p className="text-slate-500 text-sm">Publish health tips, news and company updates</p>
        </div>
        <Button onClick={() => {
          setCurrentPost({ title: '', slug: '', summary: '', content: '', author: 'MediSeller Team', image_url: '', tags: [], published: true });
          setIsEditing(true);
        }}>
          <Plus className="w-4 h-4 mr-2" /> New Article
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {posts.length > 0 ? posts.map((post) => (
           <Card key={post.post_id} className="border-slate-200 overflow-hidden flex flex-col group">
              <div className="aspect-video relative bg-slate-100 overflow-hidden">
                 {post.image_url ? 
                   <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> :
                   <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-12 h-12" /></div>
                 }
                 <div className="absolute top-2 right-2 flex gap-1">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="w-8 h-8 rounded-full"
                      onClick={() => {
                        setCurrentPost(post);
                        setIsEditing(true);
                      }}
                    >
                       <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="w-8 h-8 rounded-full"
                      onClick={() => handleDelete(post.post_id)}
                    >
                       <Trash2 className="w-4 h-4" />
                    </Button>
                 </div>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                 <div className="flex items-center text-[10px] font-bold uppercase text-slate-400 mb-2 gap-3">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(post.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {post.author}</span>
                 </div>
                 <h4 className="font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-primary transition-colors">{post.title}</h4>
                 <p className="text-xs text-slate-500 line-clamp-3 mb-4 flex-1">{post.summary}</p>
                 <div className="pt-4 border-t flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                    <span className="flex items-center text-primary"><Eye className="w-3 h-3 mr-1" /> View Live</span>
                    <span>{post.published ? 'Published' : 'Draft'}</span>
                 </div>
              </CardContent>
           </Card>
         )) : (
           <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-400">No blog posts yet</h3>
              <p className="text-slate-400 text-sm">Start your content marketing journey by writing your first article.</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default BlogManager;
