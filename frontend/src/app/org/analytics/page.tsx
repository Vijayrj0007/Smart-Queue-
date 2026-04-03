'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BarChart3, ArrowLeft } from 'lucide-react';

export default function OrgAnalyticsPage() {
  const { isOrganization } = useAuth();

  if (!isOrganization) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <p className="text-[var(--text-secondary)]">Please sign in as an organization to view analytics.</p>
        <Link className="text-[var(--primary)] hover:underline" href="/org/login">Go to Provider Login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-[var(--primary)]" />
          <h1 className="text-2xl font-bold text-[var(--secondary)]">Organization Analytics</h1>
        </div>
        <Link
          href="/org/dashboard"
          className="px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-[var(--text-secondary)]">
          Tenant-scoped analytics endpoints can be added next (additive) by filtering all queries by
          <code className="px-1 py-0.5 bg-gray-50 rounded ml-1">organization_id</code>.
        </p>
      </div>
    </div>
  );
}

