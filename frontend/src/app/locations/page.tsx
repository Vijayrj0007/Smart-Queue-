'use client';

/**
 * Locations Page
 * Browse and filter service locations (hospitals, clinics, offices)
 */
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { locationService } from '@/services/location.service';
import { MapPin, Search, Building2, Clock, Users, Filter, ChevronRight } from 'lucide-react';

interface Location {
  id: number;
  name: string;
  type: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  operating_hours: any;
  queue_count: number;
  active_queues: number;
  is_active: boolean;
}

const typeLabels: Record<string, string> = {
  hospital: '🏥 Hospital',
  clinic: '🩺 Clinic',
  office: '🏢 Office',
  bank: '🏦 Bank',
  government: '🏛️ Government',
};

const typeColors: Record<string, string> = {
  hospital: 'bg-blue-50 text-blue-700',
  clinic: 'bg-green-50 text-green-700',
  office: 'bg-purple-50 text-purple-700',
  bank: 'bg-amber-50 text-amber-700',
  government: 'bg-rose-50 text-rose-700',
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const params: any = {};
        if (search) params.search = search;
        if (typeFilter) params.type = typeFilter;
        
        const res = await locationService.getAll(params);
        setLocations(res.data.data.locations);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchLocations, 300);
    return () => clearTimeout(debounce);
  }, [search, typeFilter]);

  return (
    <div className="min-h-screen bg-[var(--bg-light)] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--secondary)] mb-3">
            Find Service Locations
          </h1>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Browse hospitals, clinics, banks, and offices. Select one to view available queues and book your token.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="card-static mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input !pl-11"
                placeholder="Search by name or location..."
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setTypeFilter('')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  !typeFilter ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {Object.entries(typeLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(typeFilter === key ? '' : key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    typeFilter === key ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Locations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card-static">
                <div className="skeleton h-6 w-48 mb-3" />
                <div className="skeleton h-4 w-32 mb-4" />
                <div className="skeleton h-20 w-full mb-3" />
                <div className="skeleton h-10 w-full" />
              </div>
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div className="card-static text-center py-16">
            <Building2 size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--secondary)] mb-2">No Locations Found</h3>
            <p className="text-[var(--text-secondary)]">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => {
              const hours = typeof location.operating_hours === 'string' 
                ? JSON.parse(location.operating_hours) 
                : location.operating_hours;
              
              return (
                <Link href={`/locations/${location.id}`} key={location.id} className="card group block">
                  {/* Type Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <span className={`badge ${typeColors[location.type] || 'bg-gray-50 text-gray-700'}`}>
                      {typeLabels[location.type] || location.type}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {location.active_queues} active
                    </div>
                  </div>

                  {/* Name & Description */}
                  <h3 className="text-lg font-bold text-[var(--secondary)] mb-1 group-hover:text-[var(--primary)] transition-colors">
                    {location.name}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                    {location.description}
                  </p>

                  {/* Info */}
                  <div className="space-y-2 mb-4">
                    {location.address && (
                      <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <MapPin size={14} className="text-[var(--primary)] mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{location.address}, {location.city}</span>
                      </div>
                    )}
                    {hours && (
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Clock size={14} className="text-[var(--primary)] flex-shrink-0" />
                        <span>{hours.open} - {hours.close}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Users size={14} className="text-[var(--primary)] flex-shrink-0" />
                      <span>{location.queue_count} queues available</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm font-semibold text-[var(--primary)]">View Queues</span>
                    <ChevronRight size={18} className="text-[var(--primary)] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
