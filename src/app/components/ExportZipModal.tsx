import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Download, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';

interface ExportZipModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  message: string;
  error: string | null;
  isComplete: boolean;
}

export function ExportZipModal({
  isOpen,
  onClose,
  progress,
  message,
  error,
  isComplete,
}: ExportZipModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {error ? (
                <AlertCircle className="size-6 text-red-500" />
              ) : isComplete ? (
                <CheckCircle2 className="size-6 text-green-500" />
              ) : (
                <Loader2 className="size-6 animate-spin text-[#059669]" />
              )}
              <CardTitle>
                {error
                  ? 'Erreur d\'export'
                  : isComplete
                  ? 'Export terminé !'
                  : 'Export en cours...'}
              </CardTitle>
            </div>
            {(error || isComplete) && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="size-4" />
              </Button>
            )}
          </div>
          <CardDescription>
            {error
              ? 'Une erreur est survenue lors de l\'export'
              : isComplete
              ? 'Le fichier ZIP a été téléchargé avec succès'
              : 'Veuillez patienter pendant la génération du ZIP...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{message}</span>
                  <span className="font-medium text-[#059669]">{progress}%</span>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {progress >= 10 ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : (
                    <div className="size-4 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={progress >= 10 ? 'text-gray-900' : 'text-gray-500'}>
                    Génération du PDF
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {progress >= 40 ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : progress >= 30 ? (
                    <Loader2 className="size-4 animate-spin text-[#059669]" />
                  ) : (
                    <div className="size-4 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={progress >= 40 ? 'text-gray-900' : 'text-gray-500'}>
                    Téléchargement des preuves
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {progress >= 95 ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : progress >= 90 ? (
                    <Loader2 className="size-4 animate-spin text-[#059669]" />
                  ) : (
                    <div className="size-4 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={progress >= 95 ? 'text-gray-900' : 'text-gray-500'}>
                    Génération du fichier ZIP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : (
                    <div className="size-4 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={isComplete ? 'text-gray-900' : 'text-gray-500'}>
                    Téléchargement du fichier
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          {(error || isComplete) && (
            <div className="flex justify-end">
              <Button onClick={onClose}>
                {error ? 'Fermer' : 'OK'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
