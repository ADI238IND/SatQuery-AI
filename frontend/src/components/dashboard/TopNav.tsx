import React, { useState, useRef, useEffect } from 'react';
import {
  Satellite,
  ChevronDown,
  Bell,
  LogOut,
  Sliders,
  HardDriveDownload,
  CheckCircle2,
  Search,
  MapPin,
  Globe2,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { MISSION_CATALOGS } from '../../lib/mockData';

interface TopNavProps {
  selectedProject: string;
  setSelectedProject: (p: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  selectedProject,
  setSelectedProject,
}) => {
  const { user, signOut } = useAuth();
  const [projectOpen, setProjectOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (projectRef.current && !projectRef.current.contains(event.target as Node)) {
        setProjectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const missionList = Object.values(MISSION_CATALOGS);

  const filteredMissions = missionList.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.state.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.scene.location.toLowerCase().includes(q)
    );
  });

  return (
    <header className="h-14 bg-surface border-b border-border px-4 flex items-center justify-between select-none z-40 relative shrink-0">
      {/* Left: Brand + Searchable Scene Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-signal/15 border border-signal/40 flex items-center justify-center text-signal">
            <Satellite className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-text-primary">SatQuery AI</span>
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Searchable Location & Scene Selector Dropdown */}
        <div className="relative" ref={projectRef}>
          <button
            onClick={() => {
              setProjectOpen(!projectOpen);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            className="flex items-center gap-2 text-xs font-medium text-text-primary hover:text-signal transition-colors bg-elevated px-3 py-1.5 rounded border border-border hover:border-signal/40"
          >
            <MapPin className="w-3.5 h-3.5 text-signal shrink-0" />
            <span className="truncate max-w-[280px] font-mono">{selectedProject}</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
          </button>

          {projectOpen && (
            <div className="absolute left-0 mt-1.5 w-[380px] bg-[#121820] border border-border-strong rounded-md shadow-2xl py-1.5 z-50 overflow-hidden">
              <div className="p-2 border-b border-border bg-base/80 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-signal shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Indian states, cities, disasters..."
                  className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted font-mono"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-text-primary">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-[320px] overflow-y-auto divide-y divide-border/40">
                {filteredMissions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-muted font-mono">
                    <Globe2 className="w-6 h-6 mx-auto mb-1 opacity-30 text-signal" />
                    <span>No scene catalog found for "{searchQuery}".</span>
                  </div>
                ) : (
                  filteredMissions.map((item) => {
                    const isSelected = item.name === selectedProject;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setSelectedProject(item.name);
                          setProjectOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-surface/80 transition-colors ${
                          isSelected ? 'bg-signal/15 text-signal' : 'text-text-primary'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{item.name}</span>
                          </div>
                          <div className="text-[10px] font-mono text-text-muted truncate mt-0.5 flex items-center gap-2">
                            <span className="text-text-secondary">{item.state}</span>
                            <span>•</span>
                            <span>GSD {item.scene.gsdMeters}m</span>
                            <span>•</span>
                            <span className={item.category === 'Golden Benchmark' ? 'text-signal' : 'text-thermal'}>
                              {item.category}
                            </span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-signal shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Telemetry Status + Alerts + Profile */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-elevated border border-border text-xs font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-signal animate-pulse" />
          <span className="text-text-secondary">Edge Node: Active</span>
          <span className="text-border">|</span>
          <span className="text-text-muted">Latency:</span>
          <span className="text-signal font-semibold">42ms</span>
        </div>

        <button
          title="Telemetry Alerts"
          className="p-1.5 rounded bg-elevated border border-border text-text-secondary hover:text-text-primary"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded bg-elevated border border-border-strong text-signal flex items-center justify-center font-mono text-xs font-semibold">
              {user?.email ? user.email.slice(0, 2).toUpperCase() : 'OP'}
            </div>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-elevated border border-border-strong rounded shadow-2xl py-1 z-50">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-xs font-medium text-text-primary">{user?.name || 'GIS Analyst'}</div>
                <div className="text-[11px] font-mono text-text-secondary truncate mt-0.5">
                  {user?.email || 'analyst@satquery.internal'}
                </div>
              </div>

              <div className="py-1 border-b border-border">
                <button className="w-full px-3 py-1.5 text-xs text-left text-text-secondary hover:text-text-primary hover:bg-surface flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" /> Node Bandwidth & Calibration
                </button>
                <button className="w-full px-3 py-1.5 text-xs text-left text-text-secondary hover:text-text-primary hover:bg-surface flex items-center gap-2">
                  <HardDriveDownload className="w-3.5 h-3.5" /> Offline Tile Cache
                </button>
              </div>

              <button
                onClick={() => signOut()}
                className="w-full px-3 py-2 text-xs text-left text-alert hover:bg-alert/10 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
