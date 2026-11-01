'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="text-center space-y-3">
          <div className="relative w-20 h-20 mx-auto rounded-2xl bg-white p-2 shadow-card border border-amber-100 flex items-center justify-center">
            <Image src="/logo.png" alt="Complexe Maher" width={72} height={72} className="object-contain" priority />
          </div>
          <h2 className="text-xl font-bold text-brand-navy">Récupération de mot de passe</h2>
          <p className="text-xs text-gray-500">
            Pour des raisons de sécurité stricte, la réinitialisation des mots de passe des employés est effectuée par l'administrateur propriétaire.
          </p>
        </div>

        <div className="mt-6 bg-white py-8 px-6 shadow-dropdown rounded-3xl border border-gray-100 sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-brand-navy">Demande transmise</h3>
              <p className="text-xs text-gray-600">
                L'administrateur du restaurant a été informé pour vous attribuer un nouveau mot de passe temporaire.
              </p>
              <Link href="/login" className="block pt-2">
                <Button variant="primary" size="md" className="w-full">
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Votre adresse email professionnelle"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nom@complexe-maher.ma"
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button type="submit" variant="primary" size="md" className="w-full">
                Envoyer la demande à l'administrateur
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour à la page de connexion</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
