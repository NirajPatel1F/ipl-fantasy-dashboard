import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  X, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Search,
  LayoutDashboard,
  Calendar,
  Zap,
  Activity
} from 'lucide-react';

// Updated Fallback Stats with granular data points
const FALLBACK_STATS = {
  "Sameer Rizvi": { runs: 160, fours: 12, sixes: 8, fifties: 1, hundreds: 0, wkts: 0, fourW: 0, fiveW: 0, catches: 2, stumpings: 0, team: "CSK" },
  "Ravi bishnoi": { runs: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, wkts: 6, fourW: 1, fiveW: 0, catches: 1, stumpings: 0, team: "LSG" },
  "Dhruv Jurel": { runs: 93, fours: 8, sixes: 3, fifties: 1, hundreds: 0, wkts: 0, fourW: 0, fiveW: 0, catches: 4, stumpings: 1, team: "RR" },
  "Rohit Sharma": { runs: 113, fours: 10, sixes: 6, fifties: 1, hundreds: 0, wkts: 0, fourW: 0, fiveW: 0, catches: 1, stumpings: 0, team: "MI" },
  "Ishan Kishan": { runs: 94, fours: 11, sixes: 4, fifties: 1, hundreds: 0, wkts: 0, fourW: 0, fiveW: 0, catches: 3, stumpings: 1, team: "MI" },
  "H. Klaasen": { runs: 83, fours: 5, sixes: 7, fifties: 0, hundreds: 0, wkts: 0, fourW: 0, fiveW: 0, catches: 5, stumpings: 2, team: "SRH" },
  "Sunil Narine": { runs: 45, fours: 4, sixes: 3, fifties: 0, hundreds: 0, wkts: 3, fourW: 0, fiveW: 0, catches: 1, stumpings: 0, team: "KKR" },
  "KG Rabada": { runs: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, wkts: 5, fourW: 1, fiveW: 0, catches: 0, stumpings: 0, team: "PBKS" },
  "Sanju Samson": { runs: 120, fours: 10, sixes: 8, fifties: 1, hundreds: 0, wkts: 0, fourW: 0, fiveW: 0, catches: 3, stumpings: 1, team: "RR" },
};

// Raw Data matched exactly to your CSV provided in the prompt
const DEFAULT_RAW_DATA = `
DIPAM: D. Miller, K.L. RAHUL, Riyan Parag, H. Klaasen, Rahane, Dhruv Jurel, Kamindu Mendis, Shahrukh khan, Rahul tewatiya, Rinku Singh, Sunil Narine, R. Jadeja, KG Rabada, T. Natarajan
PRIYANK: Vaibhav Suryavanshi, Ishan Kishan(C), Tristan Stubbs, Ruturaj Gaikwad, Glenn Phillips, Sherfane Rutherford, Ayush Badoni, Axar Patel(VC), Azmatullah Omarzai, Washington Sundar, Venkatesh Iyer, Liam Livingstone, Vipraj Nigam, Kuldeep Yadav, Ravi bishnoi
UTKARSH: Tilak verma, Shimron Hetmyer(C), Tim David, Devdutt Padikkal, Nehal Wadhera, Angkrish Raghuvanshi, Nitish Kumar Reddy, Romario Shepherd(VC), Krunal Pandya, Ashutosh Sharma, Shashank Singh, Shardul Thakur, Josh Hazlewood, Yuzvendra Chahal, Noor Ahmad
CHINTU: Jitesh Sharma, Quinton De Kock, Shubman Gill, Shreyas Iyer, Aiden Markram, Rajat Patidar, Karun Nair, Mitchell Marsh, Rachin Ravindra, Jamie Overton, Varun Chakravarthy, Deepak Chahar, Avesh Khan, Mukesh Kumar, Ishant Sharma
RAHUL: Rishabh Pant, Phil Salt, Prabhsimran Singh, Dewald Brevis, Priyansh Arya, Rovman Powell, Hardik Pandya, Corbin Bosch, Arshdeep Singh, Trent Boult, Harshal Patel, Tushar Deshpande, Jaydev Unadkat, Sandeep Sharma, Mayank Markande
BRIJRAJSINH: Sanju Samson(VC), Ryan Rickelton, Abhishek Porel, Sai Sudharsan(C), Rohit Sharma, Ayush Mhatre, Nitish Rana, David Miller, Shivam Dube, Jacob Bethell, Sameer Rizvi, R. Sai Kishore, Digvesh Rathi, Zeeshan Ansari, Anshul Kamboj
`;

// Dream11 T20 Point System
const calculateDream11Points = (stats) => {
  let pts = 0;
  pts += (stats.runs || 0) * 1;
  pts += (stats.fours || 0) * 1;
  pts += (stats.sixes || 0) * 2;
  pts += (stats.fifties || 0) * 8;
  pts += (stats.hundreds || 0) * 16;
  pts += (stats.wkts || 0) * 25;
  pts += (stats.fourW || 0) * 8;
  pts += (stats.fiveW || 0) * 16;
  pts += (stats.catches || 0) * 8;
  pts += (stats.stumpings || 0) * 12;
  return pts;
};

const App = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState(null);
  const [apiStatus, setApiStatus] = useState('Fetching live stats...');
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setApiStatus('Fetching live stats...');
        const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRl6b-pF6tdtDYG78SAnmd0tABhb9RHTU3oA9xUlht_nxtwN8Akm6DwZOr7VFtIKaCUvLanLbYrj1cr/pub?gid=677372036&single=true&output=csv'; 
        
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) throw new Error('Sheet fetch failed');
        
        const csvText = await response.text();
        const rows = csvText.split('\n').slice(1); 
        const liveStats = {};
        
        rows.forEach(row => {
          const cols = row.split(',');
          if (cols.length > 2 && cols[0]) {
            let rawName = cols[0].replace(/"/g, '').trim();
            let cleanName = rawName.split('(')[0].trim(); 
            
            const parseStat = (val) => {
              if (!val) return 0;
              const parsed = parseInt(val.replace(/"/g, '').trim());
              return isNaN(parsed) ? 0 : parsed;
            };

            liveStats[cleanName] = {
              runs: parseStat(cols[1]), 
              fours: parseStat(cols[2]), 
              sixes: parseStat(cols[3]), 
              fifties: parseStat(cols[4]),
              hundreds: parseStat(cols[5]),
              wkts: parseStat(cols[6]), 
              fourW: parseStat(cols[7]),
              fiveW: parseStat(cols[8]),
              catches: parseStat(cols[9]), 
              stumpings: parseStat(cols[10]),
              team: 'Live'
            };
          }
        });

        if(Object.keys(liveStats).length > 0) {
          setPlayerStats(liveStats);
          setApiStatus('Dream11 Engine Active');
        } else {
          throw new Error("Missing granular columns");
        }
        
      } catch (error) {
        console.warn("Using fallback local data.", error);
        setApiStatus('Using Fallback Data');
        setPlayerStats(FALLBACK_STATS);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (!playerStats) return;

    const getPlayerStats = (playerName, statsObj) => {
      if (statsObj[playerName]) return statsObj[playerName];
      
      const nameParts = playerName.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
      const lastName = nameParts[nameParts.length - 1];
      const firstInitial = nameParts[0]?.[0];

      for (const [apiName, stats] of Object.entries(statsObj)) {
        const apiParts = apiName.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
        const apiLastName = apiParts[apiParts.length - 1];
        const apiFirstInitial = apiParts[0]?.[0];

        if (apiLastName === lastName && apiFirstInitial === firstInitial) {
          return stats;
        }
      }
      return { runs: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, wkts: 0, fourW: 0, fiveW: 0, catches: 0, stumpings: 0, team: 'TBD' };
    };

    const parseRosters = () => {
      const lines = DEFAULT_RAW_DATA.trim().split('\n');
      const teamData = lines.map(line => {
        const [owner, playersStr] = line.split(':');
        const playerNames = playersStr.split(',').map(p => p.trim());
        
        let totalPoints = 0;
        const processedPlayers = playerNames.map(rawName => {
          let name = rawName.replace(/\(C\)|\(VC\)/g, '').trim();
          let role = 'Player';
          let multiplier = 1;
          
          if (rawName.includes('(C)')) {
            role = 'Captain';
            multiplier = 2;
          } else if (rawName.includes('(VC)')) {
            role = 'Vice Captain';
            multiplier = 1.5;
          }

          const stats = getPlayerStats(name, playerStats);
          const rawBasePoints = calculateDream11Points(stats);
          const calculatedPoints = rawBasePoints * multiplier;
          totalPoints += calculatedPoints;

          return { name, originalName: rawName, role, multiplier, points: calculatedPoints, ...stats };
        });

        return {
          owner,
          totalPoints: parseFloat(totalPoints.toFixed(1)),
          players: processedPlayers.sort((a, b) => b.points - a.points)
        };
      }).sort((a, b) => b.totalPoints - a.totalPoints);

      setTeams(teamData);
      setLoading(false);
    };

    parseRosters(); 
  }, [playerStats]);

  const filteredTeams = useMemo(() => {
    return teams.filter(t => 
      t.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [teams, searchTerm]);

  // Handle modal close
  const closeModal = () => {
    setSelectedTeam(null);
    setExpandedPlayer(null); // Reset expansions on close
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">{apiStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Activity className="w-8 h-8 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">DREAM11 ENGINE</h1>
                <p className="text-indigo-100 text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Season 2026 Live
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-white/20">{apiStatus}</span>
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input 
                type="text" 
                placeholder="Search owner or player..."
                className="bg-white/10 border border-white/20 rounded-full py-2 pl-10 pr-4 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/60 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl"><Users className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Teams</p>
              <p className="text-xl font-bold">{teams.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Leader</p>
              <p className="text-xl font-bold">{teams[0]?.owner}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-xl"><Zap className="w-5 h-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Top Pts</p>
              <p className="text-xl font-bold">{teams[0]?.totalPoints}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl"><LayoutDashboard className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Players</p>
              <p className="text-xl font-bold">{teams.reduce((acc, curr) => acc + curr.players.length, 0)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team, idx) => (
            <div 
              key={team.owner}
              onClick={() => setSelectedTeam(team)}
              className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 cursor-pointer transition-all duration-300 relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-12 h-12 flex items-center justify-center font-black text-sm transition-colors ${
                idx === 0 ? 'bg-yellow-400 text-yellow-900' : 
                idx === 1 ? 'bg-slate-300 text-slate-800' : 
                idx === 2 ? 'bg-orange-300 text-orange-900' : 
                'bg-slate-50 text-slate-400'
              }`}>
                #{idx + 1}
              </div>

              <div className="pt-4">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {team.owner}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-indigo-700 tracking-tighter">{team.totalPoints}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">D11 Points</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b pb-1">Star Performers</p>
                  {team.players.slice(0, 3).map((p, pIdx) => (
                    <div key={pIdx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span className="font-semibold text-slate-700 truncate max-w-[140px]">{p.name}</span>
                        {p.multiplier > 1 && (
                           <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-black">
                            {p.role === 'Captain' ? '2x' : '1.5x'}
                           </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-500 font-bold">{p.points.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex items-center justify-center text-indigo-600 font-bold text-xs bg-indigo-50 py-2.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  View Player Breakdowns <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={closeModal}></div>
          
          <div className="relative bg-slate-100 w-full max-w-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
            
            <div className="bg-indigo-700 p-6 text-white shrink-0 shadow-md z-10">
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black leading-none mb-1">{selectedTeam.owner}</h2>
                  <p className="text-indigo-200 text-sm font-medium">Player Stats Breakdown</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black tracking-tighter leading-none">{selectedTeam.totalPoints}</p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-3">
              {selectedTeam.players.map((p, idx) => {
                const isExpanded = expandedPlayer === p.name;
                
                return (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
                    {/* Clickable Header */}
                    <div 
                      onClick={() => setExpandedPlayer(isExpanded ? null : p.name)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          p.role === 'Captain' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                          p.role === 'Vice Captain' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          'bg-indigo-50 text-indigo-600'
                        }`}>
                          {p.role === 'Captain' ? 'C' : p.role === 'Vice Captain' ? 'VC' : idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-none mb-1 flex items-center gap-1.5">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            {p.role} {p.multiplier > 1 && <span className="text-indigo-600">({p.multiplier}x)</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-black text-slate-700 leading-none">{p.points.toFixed(0)}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Pts</p>
                        </div>
                        <div className="text-slate-300">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Stats Breakdown */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          
                          {/* Batting Column */}
                          <div className="space-y-2">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-blue-600 border-b border-blue-100 pb-1 mb-2">Batting</h4>
                            <div className="flex justify-between items-center"><span className="text-slate-500">Runs (1pt)</span> <span className="font-semibold">{p.runs} <span className="text-[10px] text-slate-400 ml-1">({p.runs * 1})</span></span></div>
                            <div className="flex justify-between items-center"><span className="text-slate-500">Fours (1pt)</span> <span className="font-semibold">{p.fours} <span className="text-[10px] text-slate-400 ml-1">({p.fours * 1})</span></span></div>
                            <div className="flex justify-between items-center"><span className="text-slate-500">Sixes (2pt)</span> <span className="font-semibold">{p.sixes} <span className="text-[10px] text-slate-400 ml-1">({p.sixes * 2})</span></span></div>
                            <div className="flex justify-between items-center"><span className="text-slate-500">Fifties (8pt)</span> <span className="font-semibold">{p.fifties} <span className="text-[10px] text-slate-400 ml-1">({p.fifties * 8})</span></span></div>
                            <div className="flex justify-between items-center"><span className="text-slate-500">Hundreds (16pt)</span> <span className="font-semibold">{p.hundreds} <span className="text-[10px] text-slate-400 ml-1">({p.hundreds * 16})</span></span></div>
                          </div>
                          
                          {/* Bowling Column */}
                          <div className="space-y-2">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-purple-600 border-b border-purple-100 pb-1 mb-2">Bowling</h4>
                            <div className="flex justify-between items-center"><span className="text-slate-500">Wickets (25pt)</span> <span className="font-semibold">{p.wkts} <span className="text-[10px] text-slate-400 ml-1">({p.wkts * 25})</span></span></div>
                            <div className="flex justify-between items-center"><span className="text-slate-500">4-Wkts (8pt)</span> <span className="font-semibold">{p.fourW} <span className="text-[10px] text-slate-400 ml-1">({p.fourW * 8})</span></span></div>
                            <div className="flex justify-between items-center"><span className="text-slate-500">5-Wkts (16pt)</span> <span className="font-semibold">{p.fiveW} <span className="text-[10px] text-slate-400 ml-1">({p.fiveW * 16})</span></span></div>
                          </div>

                          {/* Fielding Column */}
                          <div className="space-y-2">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-emerald-600 border-b border-emerald-100 pb-1 mb-2">Fielding</h4>
                            <div className="flex justify-between items-center"><span className="text-slate-500">Catches (8pt)</span> <span className="font-semibold">{p.catches} <span className="text-[10px] text-slate-400 ml-1">({p.catches * 8})</span></span></div>
                            <div className="flex justify-between items-center"><span className="text-slate-500">Stumpings (12pt)</span> <span className="font-semibold">{p.stumpings} <span className="text-[10px] text-slate-400 ml-1">({p.stumpings * 12})</span></span></div>
                          </div>

                        </div>
                        
                        {/* Multiplier Footer */}
                        {p.multiplier > 1 && (
                          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center font-bold text-indigo-700 bg-indigo-50/50 p-2 rounded-lg">
                            <span>Base Points: {(p.points / p.multiplier).toFixed(0)}</span>
                            <div className="flex items-center gap-2">
                              <span>Role Multiplier ({p.role})</span>
                              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px]">x{p.multiplier}</span>
                            </div>
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