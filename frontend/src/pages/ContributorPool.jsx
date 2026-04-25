import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Award,
  CheckCircle,
  ChevronDown,
  Clock,
  Filter,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const sortOptions = [
  { value: 'rating', label: 'Top rating' },
  { value: 'jobs', label: 'Most jobs' },
  { value: 'earnings', label: 'Highest earnings' },
  { value: 'recent', label: 'Most recent' },
];

function shortenAddress(address) {
  if (!address) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ContributorPool({ withNavbar = false }) {
  const [contributors, setContributors] = useState([]);
  const [selectedContributor, setSelectedContributor] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingPool, setLoadingPool] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const fetchPool = async () => {
    setLoadingPool(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/jobs/contributors/pool`);
      setContributors(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching contributor pool:', err);
      setError('Failed to load contributor pool.');
      setContributors([]);
    } finally {
      setLoadingPool(false);
    }
  };

  const fetchContributorDetail = async (walletAddress) => {
    if (!walletAddress) return;
    setLoadingDetail(true);
    try {
      const response = await axios.get(`${API_URL}/jobs/contributors/${walletAddress}`);
      setSelectedDetail(response.data);
    } catch (err) {
      console.error('Error fetching contributor detail:', err);
      setSelectedDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchPool();
  }, []);

  useEffect(() => {
    if (selectedContributor) {
      fetchContributorDetail(selectedContributor.wallet_address);
    }
  }, [selectedContributor]);

  const filteredContributors = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = contributors.filter((item) => {
      if (!needle) return true;
      return [
        item.wallet_address,
        item.display_name,
        item.gpu_model,
      ].some((value) => String(value || '').toLowerCase().includes(needle));
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'rating') return Number(b.avg_rating || 0) - Number(a.avg_rating || 0);
      if (sortBy === 'jobs') return Number(b.total_jobs_completed || 0) - Number(a.total_jobs_completed || 0);
      if (sortBy === 'earnings') return Number(b.total_earnings_eth || 0) - Number(a.total_earnings_eth || 0);
      if (sortBy === 'recent') return new Date(b.last_seen_at || 0) - new Date(a.last_seen_at || 0);
      return 0;
    });
  }, [contributors, search, sortBy]);

  const poolStats = useMemo(() => {
    const active = contributors.filter((item) => item.accepts_llm_jobs || item.accepts_yolo_jobs).length;
    const avgRating = contributors.length
      ? contributors.reduce((sum, item) => sum + Number(item.avg_rating || 0), 0) / contributors.length
      : 0;
    const totalJobs = contributors.reduce((sum, item) => sum + Number(item.total_jobs_completed || 0), 0);
    const totalEarnings = contributors.reduce((sum, item) => sum + Number(item.total_earnings_eth || 0), 0);
    return { active, avgRating, totalJobs, totalEarnings };
  }, [contributors]);

  const ratingsByJobId = useMemo(() => {
    const map = new Map();
    (selectedDetail?.ratings || []).forEach((entry) => {
      if (entry?.job_id !== undefined && entry?.job_id !== null) {
        map.set(String(entry.job_id), entry);
      }
    });
    return map;
  }, [selectedDetail]);

  const activeSortLabel = useMemo(() => {
    return sortOptions.find((option) => option.value === sortBy)?.label ?? 'Sort';
  }, [sortBy]);

  const contentPaddingTop = withNavbar ? 'pt-24' : 'pt-8';

  return (
    <div className="min-h-screen bg-transparent text-gray-900 relative overflow-hidden">
      <div className={`${contentPaddingTop} pb-12 relative z-10`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-80 h-80 bg-emerald-200/50 blur-[120px] rounded-full" />
          <div className="absolute top-40 right-12 w-96 h-96 bg-cyan-200/40 blur-[140px] rounded-full" />
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-amber-200/40 blur-[140px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/60 overflow-hidden"
          >
            <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-0">
              <div className="p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-200/80">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-gray-900">
                  Discover contributors and review their recent work.
                </h1>
                <p className="text-gray-600 max-w-2xl leading-relaxed">
                  Browse wallet-linked contributor profiles, compare reputation metrics, and see requester feedback once
                  jobs are delivered.
                </p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  {[
                    { label: 'Contributors', value: loadingPool ? '—' : contributors.length, icon: Users },
                    { label: 'Avg Rating', value: loadingPool ? '—' : poolStats.avgRating.toFixed(2), icon: Star },
                    { label: 'Jobs Tracked', value: loadingPool ? '—' : poolStats.totalJobs, icon: CheckCircle },
                    { label: 'Earnings', value: loadingPool ? '—' : `${poolStats.totalEarnings.toFixed(2)} POL`, icon: Zap },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3 text-gray-600 text-sm mb-2">
                          <span className="p-2 rounded-xl bg-slate-100">
                            <Icon size={16} />
                          </span>
                          {item.label}
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10 bg-slate-50/80">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3 text-emerald-700 mb-2">
                      <ShieldCheck size={18} />
                      <span className="font-medium">Requester feedback</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Ratings appear once the requester confirms delivery of a trained model.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3 text-cyan-700 mb-2">
                      <TrendingUp size={18} />
                      <span className="font-medium">Reputation signals</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Sort by rating, completed jobs, earnings, or last seen activity to identify active contributors.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3 text-amber-700 mb-2">
                      <Clock size={18} />
                      <span className="font-medium">Recent history</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Each profile shows the latest 10 contributions with any requester ratings shown per job.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="grid xl:grid-cols-[1fr_420px] gap-6 mt-8">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-xl p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by wallet, display name, or GPU model"
                      className="w-full rounded-2xl bg-white border border-slate-200 pl-11 pr-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-emerald-400/40"
                    />
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSortMenuOpen((prev) => !prev)}
                      className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-400/40 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2 text-gray-700">
                        <Filter size={18} className="text-gray-400" />
                        {activeSortLabel}
                      </span>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {sortMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-20"
                        >
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setSortBy(option.value);
                                setSortMenuOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                option.value === sortBy
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
              </div>

              {loadingPool ? (
                <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-xl p-10 flex items-center justify-center min-h-[360px]">
                  <div className="text-center">
                    <Loader2 className="mx-auto animate-spin text-emerald-500" size={36} />
                    <p className="mt-4 text-gray-600">Loading contributor pool...</p>
                  </div>
                </div>
              ) : filteredContributors.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-xl p-10 min-h-[360px] flex items-center justify-center text-center">
                  <div>
                    <MessageSquare className="mx-auto text-gray-400" size={36} />
                    <h3 className="mt-4 text-xl font-semibold text-gray-900">No contributors found</h3>
                    <p className="mt-2 text-gray-500 max-w-md">
                      Try a different search term or check back after contributors update their profile.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <AnimatePresence>
                    {filteredContributors.map((contributor, index) => (
                      <motion.button
                        key={contributor.wallet_address}
                        type="button"
                        onClick={() => setSelectedContributor(contributor)}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 18 }}
                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        className={`text-left rounded-3xl border backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${selectedContributor?.wallet_address === contributor.wallet_address ? 'bg-emerald-50 border-emerald-200 shadow-emerald-200/60' : 'bg-white/90 border-slate-200 hover:border-slate-300 shadow-sm'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-semibold">
                                {shortenAddress(contributor.wallet_address).slice(0, 2)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {contributor.display_name || shortenAddress(contributor.wallet_address)}
                                </h3>
                                <p className="text-xs text-gray-500 font-mono">{shortenAddress(contributor.wallet_address)}</p>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              <p>{contributor.gpu_model || 'GPU model not provided'}</p>
                              <p>{contributor.vram_gb ? `${contributor.vram_gb} GB VRAM` : 'VRAM not provided'}</p>
                              <p>{contributor.total_jobs_completed || 0} completed jobs</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-sm font-medium">
                              <Star size={14} fill="currentColor" />
                              {Number(contributor.avg_rating || 0).toFixed(2)}
                            </div>
                            <p className="mt-2 text-xs text-gray-500">{contributor.rating_count || 0} ratings</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                            <p className="text-gray-500 text-xs mb-1">Accepts LLM</p>
                            <p className={contributor.accepts_llm_jobs ? 'text-emerald-700' : 'text-gray-400'}>
                              {contributor.accepts_llm_jobs ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                            <p className="text-gray-500 text-xs mb-1">Last seen</p>
                            <p className="text-gray-600 text-xs">{formatDate(contributor.last_seen_at)}</p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-xl p-6 sticky top-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <Award size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Contributor Details</h2>
                    <p className="text-sm text-gray-500">History and feedback panel</p>
                  </div>
                </div>

                {!selectedContributor ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-gray-600">Select a contributor to inspect their profile and history.</p>
                  </div>
                ) : loadingDetail ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-500" size={34} />
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl bg-white border border-slate-200 p-4 mb-5">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Wallet</p>
                          <h3 className="text-lg font-semibold text-gray-900">{shortenAddress(selectedContributor.wallet_address)}</h3>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm">
                          <CheckCircle size={14} />
                          {selectedDetail?.profile?.accepts_llm_jobs ? 'Open to LLM jobs' : 'Not taking LLM jobs'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <p className="text-gray-500 text-xs">Average rating</p>
                          <p className="text-gray-900 text-lg font-semibold">{Number(selectedDetail?.summary?.avg_rating ?? selectedContributor.avg_rating ?? 0).toFixed(2)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <p className="text-gray-500 text-xs">Jobs completed</p>
                          <p className="text-gray-900 text-lg font-semibold">{selectedDetail?.summary?.total_jobs_completed ?? selectedContributor.total_jobs_completed ?? 0}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <p className="text-gray-500 text-xs">Total earnings</p>
                          <p className="text-gray-900 text-lg font-semibold">{Number(selectedDetail?.summary?.total_earnings_eth ?? selectedContributor.total_earnings_eth ?? 0).toFixed(4)} POL</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <p className="text-gray-500 text-xs">Ratings</p>
                          <p className="text-gray-900 text-lg font-semibold">{selectedDetail?.summary?.rating_count ?? selectedContributor.rating_count ?? 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <Clock size={16} />
                        <h4 className="font-semibold">Latest Contributions</h4>
                      </div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {(selectedDetail?.history || []).length === 0 ? (
                          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-gray-500">
                            No contribution history available yet.
                          </div>
                        ) : (
                          selectedDetail.history.map((entry) => {
                            const ratingEntry = ratingsByJobId.get(String(entry.job_id));
                            const ratingValue = ratingEntry?.rating;
                            return (
                              <div key={`${entry.job_id}-${entry.created_at}`} className="rounded-2xl bg-white border border-slate-200 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-gray-900 font-medium">Job #{entry.job_id}</p>
                                  <p className="text-xs text-gray-500 mt-1">{entry.job_type || 'job'} • {entry.contribution_status}</p>
                                </div>
                                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-gray-600">
                                  {Number(entry.reward_earned || 0).toFixed(4)} POL
                                </span>
                              </div>
                              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                <span>Updated {formatDate(entry.completed_at || entry.submitted_at || entry.created_at)}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                                  ratingValue ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-50 text-gray-500 border-slate-200'
                                }`}>
                                  <Star size={12} />
                                  {ratingValue ? `${ratingValue} / 5` : 'Not rated'}
                                </span>
                              </div>
                            </div>
                          );
                        })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

