import React, { useState, useRef, useEffect } from 'react';
import {
  Satellite,
  ChevronDown,
  Bell,
  LogOut,
  Sliders,
  HardDriveDownload,
  Check,
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
    <header className="h-14 bg-surface border-b border-border px-4 flex items-center justify-between select-none z-[1000] relative shrink-0">
      {/* Left: Brand Identity & Location Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-signal/15 border border-signal/30 flex items-center justify-center text-signal shadow-sm">
            <Satellite className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-base tracking-tight text-text-primary font-sans">SatQuery</span>
            <span className="font-bold text-base tracking-tight text-signal font-sans">AI</span>
          </div>
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Project / Scene Selector Dropdown (Golden Demo Benchmark Switcher) */}
        <div className="relative flex items-center gap-2" ref={projectRef}>
          <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider hidden sm:inline-block">
            Project / Scene:
          </span>
          <button
            onClick={() => {
              setProjectOpen(!projectOpen);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            className="flex items-center gap-2 text-xs font-medium text-text-primary hover:text-signal transition-all bg-elevated px-3 py-1.5 rounded-lg border border-border hover:border-signal/50 shadow-sm cursor-pointer"
            title="Switch instantly between pre-loaded satellite projects and demo benchmark scenes"
          >
            <MapPin className="w-3.5 h-3.5 text-signal shrink-0" />
            <span className="truncate max-w-[240px] md:max-w-[300px] font-semibold font-sans">{selectedProject}</span>
            <span className="text-[9px] font-mono text-signal bg-signal/10 px-1.5 py-0.5 rounded border border-signal/20 hidden md:inline-block">
              Default Scenario
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform ${projectOpen ? 'rotate-180' : ''}`} />
          </button>

          {projectOpen && (
            <div className="absolute left-0 top-full mt-2 w-[420px] bg-[#121824] border border-border-strong rounded-lg shadow-2xl z-[1001] overflow-hidden backdrop-blur-md">
              <div className="p-3 border-b border-border bg-surface/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary font-sans">Select Project / Benchmark Scene</span>
                  <span className="text-[10px] font-mono text-signal bg-signal/15 px-1.5 py-0.5 rounded border border-signal/30 font-semibold">
                    Instant Switch
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-[#090d14] px-2.5 py-1.5 rounded border border-border">
                  <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Nepal, Uttarakhand, Assam, Wayanad scenes..."
                    className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted font-mono"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-text-primary">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[320px] overflow-y-auto divide-y divide-border/40 p-1">
                {filteredMissions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-muted font-mono">
                    <Globe2 className="w-5 h-5 mx-auto mb-1 opacity-40 text-text-secondary" />
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
                        className={`w-full text-left p-2.5 rounded-md text-xs flex items-center justify-between hover:bg-surface/90 transition-all cursor-pointer ${
                          isSelected ? 'bg-signal/10 border border-signal/40 text-signal font-semibold' : 'text-text-primary hover:text-text-primary'
                        }`}
                      >
                        <div className="min-w-0 pr-2 space-y-1">
                          <div className="font-semibold text-xs truncate flex items-center gap-2">
                            <span>{item.name}</span>
                          </div>
                          <div className="text-[10px] font-mono text-text-muted truncate flex items-center gap-2">
                            <span>{item.state}</span>
                            <span>•</span>
                            <span>GSD {item.scene.gsdMeters}m</span>
                            <span>•</span>
                            <span className="text-text-secondary">{item.category}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-signal shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Operational Telemetry & Profile */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-elevated border border-border text-xs font-mono">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-signal" />
          <span className="text-text-secondary">Pipeline: Active</span>
          <span className="text-border">|</span>
          <span className="text-text-muted">Latency:</span>
          <span className="text-text-primary">42ms</span>
        </div>

        <button
          title="System Notifications"
          className="p-1.5 rounded bg-elevated border border-border text-text-secondary hover:text-text-primary transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="w-7 h-7 rounded bg-elevated border border-border-strong text-signal flex items-center justify-center font-mono text-xs font-semibold">
              {user?.email ? user.email.slice(0, 2).toUpperCase() : 'AN'}
            </div>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-elevated border border-border-strong rounded shadow-xl py-1 z-[1001] font-sans">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-xs font-medium text-text-primary">{user?.name || 'GIS Analyst'}</div>
                <div className="text-[11px] font-mono text-text-secondary truncate mt-0.5">
                  {user?.email || 'analyst@satquery.internal'}
                </div>
              </div>

              <div className="py-1 border-b border-border text-xs">
                <button className="w-full px-3 py-1.5 text-left text-text-secondary hover:text-text-primary hover:bg-surface flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" /> Sensor Calibration
                </button>
                <button className="w-full px-3 py-1.5 text-left text-text-secondary hover:text-text-primary hover:bg-surface flex items-center gap-2">
                  <HardDriveDownload className="w-3.5 h-3.5" /> Offline Tiles
                </button>
              </div>

              <button
                onClick={() => signOut()}
                className="w-full px-3 py-1.5 text-xs text-left text-alert hover:bg-alert/10 flex items-center gap-2"
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
