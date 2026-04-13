import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, TrendingUp, X, ChevronDown, ChevronUp, Search, 
  LayoutDashboard, Calendar, Zap, Activity, Settings, RefreshCw, Database, AlertCircle, Link
} from 'lucide-react';

const API_BASE_URL = 'http://34.123.229.223/api';

const App = () => {
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Dynamic Player Logs State
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [playerLogs, setPlayerLogs] = useState({});
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  // Settings & Sync State
  const [showSettings, setShowSettings] = useState(false);
  const [seriesId, setSeriesId] = useState('');
  const [apiStatus, setApiStatus] = useState('Connecting to Backend...');
  const [isSyncing, setIsSyncing] = useState(false);

  // Initial DB Load
  const fetchDashboardData = async () => {
    try {
      const setRes = await fetch(`${API_BASE_URL}/settings`);
      if (setRes.ok) {
        const settings = await setRes.json();
        setSeriesId(settings.seriesId || '');
      }

      const teamRes = await fetch(`${API_BASE_URL}/teams`);
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeams(teamData);
        setApiStatus('Database Connected & Live');
      }
    } catch (err) {
      console.error(err);
      setApiStatus('Backend Disconnected (Ensure .NET API is running)');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Trigger Backend to run the Scraper Engine
  const handleSyncAPI = async () => {
    if (!seriesId) return alert('Please enter a valid ESPN Cricinfo URL.');
    setIsSyncing(true);
    setApiStatus('Commanding Web Scraper Engine...');
    
    try {
      // 1. Update backend URL setting (API Key is no longer needed but backend expects the object)
      await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: "SCRAPER_MODE", seriesId })
      });

      // 2. Trigger parsing, downloading, and D11 math calculation
      const syncRes = await fetch(`${API_BASE_URL}/sync`, { method: 'POST' });
      
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        alert(syncData.message || `Sync Complete! ${syncData.synced} new matches scraped.`);
        setApiStatus(`Sync Complete: ${syncData.total} matches archived in SQLite.`);
        setShowSettings(false);
        fetchDashboardData(); // Refresh the UI with the newly calculated scores!
      } else {
        const errData = await syncRes.text();
        alert(`Error: ${errData}`);
        setApiStatus('Scraping Error. Check Network/Console.');
      }
    } catch (err) {
      setApiStatus('API Error. Check .NET Console.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = async () => {
    if(window.confirm('Clear all cached matches from SQLite? This cannot be undone.')) {
      await fetch(`${API_BASE_URL}/sync`, { method: 'DELETE' });
      setPlayerLogs({}); // Clear frontend cache
      fetchDashboardData();
      setApiStatus('Database Cache Cleared');
    }
  };

  // Dynamic Log Fetching
  const handleExpandPlayer = async (playerName) => {
    if (expandedPlayer === playerName) {
      setExpandedPlayer(null);
      return;
    }
    
    setExpandedPlayer(playerName);
    
    // Only fetch if we haven't loaded this player's logs yet
    if (!playerLogs[playerName]) {
      setIsLoadingLogs(true);
      try {
        const res = await fetch(`${API_BASE_URL}/players/${encodeURIComponent(playerName)}/matches`);
        if (res.ok) {
          const data = await res.json();
          setPlayerLogs(prev => ({ ...prev, [playerName]: data }));
        }
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setIsLoadingLogs(false);
      }
    }
  };

  const filteredTeams = useMemo(() => {
    return teams.filter(t => 
      t.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [teams, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-inner">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  D11 .NET ENGINE <span className="text-[10px] bg-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-widest text-emerald-50">Scraper Edition</span>
                </h1>
                <p className="text-slate-400 text-xs font-medium flex items-center gap-2 mt-1">
                  <Database className="w-3 h-3" /> {apiStatus}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search owners/players..."
                  className="bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2.5 rounded-lg transition-colors border ${showSettings ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* WEB SCRAPER SETTINGS PANEL */}
      {showSettings && (
        <div className="bg-slate-800 border-b border-slate-700 text-white shadow-inner animate-in slide-in-from-top-4">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="w-full flex-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Link className="w-3 h-3" /> ESPN Cricinfo Target URLs
                </label>
                <input 
                  type="text" 
                  value={seriesId} onChange={e => setSeriesId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Paste Match Schedule URL -OR- comma-separated /full-scorecard URLs..."
                />
              </div>
              <button 
                onClick={handleSyncAPI}
                disabled={isSyncing}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {isSyncing ? 'Scraping Data...' : 'Scrape Live Data'}
              </button>
              
              <button 
                onClick={handleClearCache}
                className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-lg border border-red-400/20" title="Clear DB Cache"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-xs text-indigo-300 bg-indigo-900/30 p-3 rounded-lg border border-indigo-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p><strong>Scraper Bypass Active:</strong> This engine mimics a Google Chrome browser to read scorecards directly from Cricinfo, completely bypassing API limits.</p>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {teams.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-200">
             <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid mx-auto mb-4"></div>
             <p className="text-slate-600 font-medium">Booting connection to SQLite Database...</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team, idx) => (
              <div 
                key={team.owner}
                onClick={() => setSelectedTeam(team)}
                className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-300 cursor-pointer transition-all duration-300 relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-12 h-12 flex items-center justify-center font-black text-sm transition-colors ${
                  idx === 0 ? 'bg-yellow-400 text-yellow-900' : 
                  idx === 1 ? 'bg-slate-300 text-slate-800' : 
                  idx === 2 ? 'bg-orange-300 text-orange-900' : 
                  'bg-slate-100 text-slate-400'
                }`}>
                  #{idx + 1}
                </div>

                <div className="pt-4">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{team.owner}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-indigo-700 tracking-tighter leading-none">{team.totalPoints}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total Pts</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b pb-1">Top Performers</p>
                    {team.players.slice(0, 3).map((p, pIdx) => (
                      <div key={pIdx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          <span className="font-semibold text-slate-700 truncate max-w-[140px]">{p.name}</span>
                          {p.multiplier > 1 && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black">
                              {p.role === 'Captain' ? '2x' : '1.5x'}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-600 font-bold">{p.points.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MATCH LOG MODAL */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => { setSelectedTeam(null); setExpandedPlayer(null); }}></div>
          
          <div className="relative bg-slate-50 w-full max-w-4xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
            
            <div className="bg-slate-900 p-6 text-white shrink-0 shadow-md z-10 border-b border-slate-700">
              <button 
                onClick={() => { setSelectedTeam(null); setExpandedPlayer(null); }}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black leading-none mb-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{selectedTeam.owner}</h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">Season Player Overview</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black tracking-tighter leading-none">{selectedTeam.totalPoints}</p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
              {selectedTeam.players.map((p, idx) => {
                const isExpanded = expandedPlayer === p.name;
                const logs = playerLogs[p.name];
                
                return (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
                    <div 
                      onClick={() => handleExpandPlayer(p.name)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-indigo-50/50 select-none"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border-2 ${
                          p.role === 'Captain' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          p.role === 'Vice Captain' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {p.role === 'Captain' ? 'C' : p.role === 'Vice Captain' ? 'VC' : idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-slate-800 leading-none mb-1.5">{p.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {logs ? `${logs.length} Matches Played` : 'Click to fetch logs'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-black text-slate-800 leading-none">{p.points.toFixed(0)}</p>
                          {p.multiplier > 1 && <p className="text-[9px] text-indigo-500 font-bold uppercase mt-1 text-right">Incl. {p.multiplier}x Multiplier</p>}
                        </div>
                        <div className="text-slate-300">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-200 p-4">
                        
                        {/* Overall Breakdown Header */}
                        {p.breakdown && (
                          <div className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-xl mb-4 shadow-sm">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Season Base Breakdown</p>
                              <div className="flex gap-3 text-xs font-semibold text-slate-600">
                                <span title="Batting"><span className="text-slate-400 font-normal">Bat:</span> {p.breakdown.bat}</span>
                                <span title="Bowling"><span className="text-slate-400 font-normal">Bowl:</span> {p.breakdown.bowl}</span>
                                <span title="Fielding"><span className="text-slate-400 font-normal">Field:</span> {p.breakdown.field}</span>
                                {p.breakdown.bonus > 0 && <span className="text-emerald-500" title="Bonuses">+{p.breakdown.bonus}</span>}
                                {p.breakdown.penalty < 0 && <span className="text-red-500" title="Penalties">{p.breakdown.penalty}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Base Points</p>
                              <p className="text-lg font-black text-indigo-700 leading-none">{p.basePoints}</p>
                            </div>
                          </div>
                        )}

                        {/* Logs List */}
                        {isLoadingLogs && !logs ? (
                          <p className="text-center text-indigo-500 text-sm py-4 font-bold animate-pulse">Fetching match logs from database...</p>
                        ) : !logs || logs.length === 0 ? (
                          <p className="text-center text-slate-400 text-sm py-4 italic">No matches scraped yet or player hasn't played.</p>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200">
                               <div className="col-span-4">Match</div>
                               <div className="col-span-3 text-center">Batting</div>
                               <div className="col-span-3 text-center">Bowling</div>
                               <div className="col-span-2 text-right">Match Pts</div>
                            </div>
                            
                            {logs.map((log, i) => (
                              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-xs transition-colors hover:border-indigo-200">
                                <div className="col-span-4 font-bold text-slate-700 truncate" title={log.matchName}>{log.matchName}</div>
                                
                                <div className="col-span-3 text-center flex justify-center gap-1">
                                  {log.stats.balls > 0 ? (
                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-semibold">{log.stats.runs} <span className="text-[9px] text-blue-400">({log.stats.balls})</span></span>
                                  ) : <span className="text-slate-300">-</span>}
                                </div>
                                
                                <div className="col-span-3 text-center flex justify-center gap-1">
                                  {log.stats.overs > 0 ? (
                                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono font-semibold">{log.stats.wickets}/{log.stats.bowlRuns} <span className="text-[9px] text-purple-400">({log.stats.overs})</span></span>
                                  ) : <span className="text-slate-300">-</span>}
                                </div>

                                <div className="col-span-2 text-right">
                                  <div className="font-black text-slate-800 text-sm group relative inline-block cursor-help border-b border-dashed border-slate-300">
                                    {log.pts}
                                    
                                    <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl z-50 text-left">
                                      <div className="flex justify-between border-b border-slate-700 pb-1.5 mb-1.5"><span className="text-slate-300">Batting</span> <span className="font-bold text-white">{log.breakdown.bat}</span></div>
                                      <div className="flex justify-between border-b border-slate-700 pb-1.5 mb-1.5"><span className="text-slate-300">Bowling</span> <span className="font-bold text-white">{log.breakdown.bowl}</span></div>
                                      <div className="flex justify-between border-b border-slate-700 pb-1.5 mb-1.5"><span className="text-slate-300">Fielding</span> <span className="font-bold text-white">{log.breakdown.field}</span></div>
                                      <div className="flex justify-between text-emerald-400 mb-0.5"><span>SR/Eco Bonus</span> <span>+{log.breakdown.bonus}</span></div>
                                      <div className="flex justify-between text-red-400"><span>SR/Eco/Duck Penalty</span> <span>{log.breakdown.penalty}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;