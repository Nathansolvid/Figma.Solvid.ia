import React, { useState, useRef } from 'react';
import { Upload, File, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { toast } from 'sonner';
import { evidenceService } from '@/services/evidenceService';
import { useUser } from '@/contexts/UserContext';

interface EvidenceUploadProps {
  indicatorId: string;
  indicatorCode?: string;
  packId: string; // Required for local mode
  onUploadSuccess?: (evidence: any) => void;
  onUploadError?: (error: Error) => void;
  maxFileSizeMB?: number;
  acceptedFileTypes?: string[];
}

export function EvidenceUpload({
  indicatorId,
  indicatorCode,
  packId,
  onUploadSuccess,
  onUploadError,
  maxFileSizeMB = 50,
  acceptedFileTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
}: EvidenceUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useUser();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      toast.error('Fichier trop volumineux', {
        description: `La taille maximale est de ${maxFileSizeMB} MB`,
      });
      return;
    }

    // Validate file type
    if (acceptedFileTypes.length > 0 && !acceptedFileTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté', {
        description: 'Veuillez sélectionner un fichier PDF, image, Excel ou CSV',
      });
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return;

    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload file using evidenceService (LOCAL)
      const evidence = await evidenceService.uploadEvidence(
        selectedFile,
        'kpi',
        indicatorId,
        packId,
        currentUser.id,
        currentUser.name,
        currentUser.role
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');


      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(evidence);
      }

      // Reset after 2 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadStatus('idle');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus('error');

      toast.error('Erreur lors de l\'upload', {
        description: error.message || 'Une erreur est survenue',
      });

      // Call error callback
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Uploader une preuve</h3>
          {indicatorCode && (
            <p className="text-sm text-gray-600 mt-1">
              Pour l'indicateur : <span className="font-medium">{indicatorCode}</span>
            </p>
          )}
        </div>

        {/* File Input */}
        {!selectedFile && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#059669] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Cliquez pour sélectionner un fichier ou glissez-déposez
            </p>
            <p className="text-xs text-gray-500">
              PDF, Images, Excel, CSV (max {maxFileSizeMB} MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept={acceptedFileTypes.join(',')}
            />
          </div>
        )}

        {/* Selected File */}
        {selectedFile && uploadStatus !== 'success' && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <File className="size-10 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>

                {/* Progress Bar */}
                {uploadStatus === 'uploading' && (
                  <div className="mt-3">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">{uploadProgress}% uploadé</p>
                  </div>
                )}

                {/* Error State */}
                {uploadStatus === 'error' && (
                  <div className="mt-2 flex items-center gap-2 text-red-600">
                    <AlertCircle className="size-4" />
                    <p className="text-xs">L'upload a échoué</p>
                  </div>
                )}
              </div>

              {/* Cancel Button */}
              {uploadStatus === 'idle' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="flex-shrink-0"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            {uploadStatus === 'idle' && (
              <div className="flex gap-2 mt-4">
                <Button onClick={handleUpload} disabled={uploading} className="flex-1">
                  {uploading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="size-4 mr-2" />
                      Uploader
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={uploading}>
                  Annuler
                </Button>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex gap-2 mt-4">
                <Button onClick={handleUpload} className="flex-1">
                  Réessayer
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Success State */}
        {uploadStatus === 'success' && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-10 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">Fichier uploadé avec succès !</p>
                <p className="text-xs text-green-700 mt-1">
                  {selectedFile?.name} a été ajouté comme preuve
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500">
          <p>💡 Formats acceptés : PDF, PNG, JPG, Excel (.xlsx, .xls), CSV</p>
          <p className="mt-1">💡 Les fichiers sont stockés de manière sécurisée et privée</p>
        </div>
      </div>
    </Card>
  );
}