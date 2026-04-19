import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Upload, Trash2, Copy, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getAuthToken } from '@/lib/api';
import { API_ENDPOINTS, BACKEND_URL } from '@/config/api';

interface MediaFile {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
  created_at: string;
}

interface Props {
  pickerMode?: boolean;
  onPick?: (url: string) => void;
}

export const MediaLibrary = ({ pickerMode = false, onPick }: Props) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ files: MediaFile[] }>(API_ENDPOINTS.admin.media, {
        auth: true,
      });
      setFiles(data.files || []);
    } catch (e: any) {
      toast.error('Failed to load media: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = getAuthToken();
      const res = await fetch(API_ENDPOINTS.admin.mediaUpload, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed');
      toast.success('Uploaded');
      load();
    } catch (e: any) {
      toast.error('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(API_ENDPOINTS.admin.mediaById(id), {
        method: 'DELETE',
        auth: true,
      });
      toast.success('Deleted');
      load();
    } catch (e: any) {
      toast.error('Delete failed: ' + e.message);
    }
  };

  const copyUrl = (url: string) => {
    // Prefer the canonical backend URL (works everywhere) over the request.base_url Render proxy form
    const canonical = `${BACKEND_URL}/api/media/${url.split('/api/media/')[1]}`;
    navigator.clipboard.writeText(canonical);
    toast.success('Copied to clipboard');
  };

  return (
    <Card data-testid="media-library-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" /> Media Library ({files.length})
            </CardTitle>
            <CardDescription>
              Upload JPG / PNG / WEBP / GIF, max 10MB. Copy the URL and paste into any product image field.
            </CardDescription>
          </div>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={onFileChosen}
              className="hidden"
              data-testid="media-upload-input"
            />
            <Button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              data-testid="media-upload-btn"
            >
              <Upload className="h-4 w-4 mr-2" /> {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        ) : files.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No files uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {files.map((f) => (
              <div
                key={f.id}
                className="border rounded-lg p-2 bg-card"
                data-testid={`media-file-${f.id}`}
              >
                <div className="aspect-square bg-muted rounded overflow-hidden mb-2 cursor-pointer"
                  onClick={() => (pickerMode && onPick ? onPick(`${BACKEND_URL}/api/media/${f.id}`) : null)}
                >
                  <img
                    src={f.url}
                    alt={f.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs truncate" title={f.filename}>{f.filename}</p>
                <p className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</p>
                <div className="flex gap-1 mt-2">
                  {pickerMode ? (
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => onPick?.(`${BACKEND_URL}/api/media/${f.id}`)}
                      data-testid={`pick-media-${f.id}`}
                    >
                      Use
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7"
                        onClick={() => copyUrl(f.url)}
                        title="Copy URL"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="h-7">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{f.filename}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              File will be soft-deleted (not visible anywhere on the site).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(f.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
