import { useEffect, useMemo, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Award,
  CheckCircle,
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
import Navbar from '../components/Navbar';
import { UserContext } from '../context/UserContext';

const API_URL = import.meta.env.VITE_API_URL;

const ratingLabels = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

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

function RatingStars({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`p-2 rounded-full transition-all duration-200 ${star <= value ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'}`}
          aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
        >
          <Star size={18} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
      <span className="text-sm text-gray-500 ml-2">{ratingLabels[value] || 'Select a rating'}</span>
    </div>
  );
}

export default function ContributorPool() {
  const { userAddress } = useContext(UserContext);
  const isPublicRoute = typeof window !== 'undefined' && window.location.pathname === '/contributor-pool';
  const [contributors, setContributors] = useState([]);
  const [selectedContributor, setSelectedContributor] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingPool, setLoadingPool] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [ratingJobId, setRatingJobId] = useState('');
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingReview, setRatingReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

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
      setRatingJobId((response.data?.history?.[0]?.job_id ?? '').toString());
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

  const handleSubmitRating = async (event) => {
    event.preventDefault();
    if (!selectedContributor || !selectedDetail?.profile) return;

    const requesterAddress = userAddress || localStorage.getItem('userAddress');
    if (!requesterAddress) {
      setError('Log in to submit a contributor rating.');
      return;
    }
    if (!ratingJobId) {
      setError('Choose a job from the contributor history before rating.');
      return;
    }

    setSubmittingRating(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/jobs/contributors/rate`, {
        jobId: Number(ratingJobId),
        requesterAddress,
        contributorAddress: selectedContributor.wallet_address,
        rating: ratingValue,
        review: ratingReview,
      });

      setRatingReview('');
      await fetchPool();
      await fetchContributorDetail(selectedContributor.wallet_address);
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {isPublicRoute && <Navbar />}
      <div className={`${isPublicRoute ? 'pt-24' : 'pt-6'} pb-12 relative z-10`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-80 h-80 bg-emerald-500/20 blur-[120px] rounded-full" />
          <div className="absolute top-40 right-12 w-96 h-96 bg-cyan-500/15 blur-[140px] rounded-full" />
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-amber-500/10 blur-[140px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden"
          >
            <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-0">
              <div className="p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/20 text-sm font-medium mb-5">
                  <Users size={16} /> Contributor Pool
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                  Discover contributors, review history, and rate completed work.
                </h1>
                <p className="text-slate-300 max-w-2xl leading-relaxed">
                  Browse wallet-linked contributor profiles, compare reputation metrics, and submit requestor feedback
                  tied to completed jobs.
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
                      <div key={item.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                        <div className="flex items-center gap-3 text-slate-300 text-sm mb-2">
                          <span className="p-2 rounded-xl bg-white/10">
                            <Icon size={16} />
                          </span>
                          {item.label}
                        </div>
                        <div className="text-2xl font-semibold text-white">{item.value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10 bg-slate-950/40">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3 text-emerald-200 mb-2">
                      <ShieldCheck size={18} />
                      <span className="font-medium">Requestor feedback ready</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Select a contributor to view their latest contribution trail and leave a 1 to 5 star rating with optional notes.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3 text-cyan-200 mb-2">
                      <TrendingUp size={18} />
                      <span className="font-medium">Reputation signals</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Sort by rating, completed jobs, earnings, or last seen activity to identify active contributors.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3 text-amber-200 mb-2">
                      <Clock size={18} />
                      <span className="font-medium">Recent history</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Each profile shows the latest 10 contribution rows so requestors can rate against real job history.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="grid xl:grid-cols-[1fr_420px] gap-6 mt-8">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by wallet, display name, or GPU model"
                      className="w-full rounded-2xl bg-slate-950/60 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-400/40"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="w-full appearance-none rounded-2xl bg-slate-950/60 border border-white/10 pl-11 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-400/40"
                    >
                      <option value="rating">Top rating</option>
                      <option value="jobs">Most jobs</option>
                      <option value="earnings">Highest earnings</option>
                      <option value="recent">Most recent</option>
                    </select>
                  </div>
                </div>
                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
              </div>

              {loadingPool ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 flex items-center justify-center min-h-[360px]">
                  <div className="text-center">
                    <Loader2 className="mx-auto animate-spin text-emerald-300" size={36} />
                    <p className="mt-4 text-slate-300">Loading contributor pool...</p>
                  </div>
                </div>
              ) : filteredContributors.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 min-h-[360px] flex items-center justify-center text-center">
                  <div>
                    <MessageSquare className="mx-auto text-slate-500" size={36} />
                    <h3 className="mt-4 text-xl font-semibold text-white">No contributors found</h3>
                    <p className="mt-2 text-slate-400 max-w-md">
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
                        className={`text-left rounded-3xl border backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${selectedContributor?.wallet_address === contributor.wallet_address ? 'bg-emerald-500/10 border-emerald-400/30 shadow-emerald-500/10' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-emerald-200 font-semibold">
                                {shortenAddress(contributor.wallet_address).slice(0, 2)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">
                                  {contributor.display_name || shortenAddress(contributor.wallet_address)}
                                </h3>
                                <p className="text-xs text-slate-400 font-mono">{shortenAddress(contributor.wallet_address)}</p>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-300">
                              <p>{contributor.gpu_model || 'GPU model not provided'}</p>
                              <p>{contributor.vram_gb ? `${contributor.vram_gb} GB VRAM` : 'VRAM not provided'}</p>
                              <p>{contributor.total_jobs_completed || 0} completed jobs</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-200 border border-amber-400/20 text-sm font-medium">
                              <Star size={14} fill="currentColor" />
                              {Number(contributor.avg_rating || 0).toFixed(2)}
                            </div>
                            <p className="mt-2 text-xs text-slate-400">{contributor.rating_count || 0} ratings</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                          <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-3">
                            <p className="text-slate-400 text-xs mb-1">Accepts LLM</p>
                            <p className={contributor.accepts_llm_jobs ? 'text-emerald-300' : 'text-slate-500'}>
                              {contributor.accepts_llm_jobs ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-3">
                            <p className="text-slate-400 text-xs mb-1">Last seen</p>
                            <p className="text-slate-200 text-xs">{formatDate(contributor.last_seen_at)}</p>
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
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sticky top-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center text-emerald-200">
                    <Award size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Contributor Details</h2>
                    <p className="text-sm text-slate-400">History and rating panel</p>
                  </div>
                </div>

                {!selectedContributor ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-6 text-center">
                    <p className="text-slate-300">Select a contributor to inspect their profile and history.</p>
                  </div>
                ) : loadingDetail ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-300" size={34} />
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-4 mb-5">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Wallet</p>
                          <h3 className="text-lg font-semibold text-white">{shortenAddress(selectedContributor.wallet_address)}</h3>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-400/20 text-sm">
                          <CheckCircle size={14} />
                          {selectedDetail?.profile?.accepts_llm_jobs ? 'Open to LLM jobs' : 'Not taking LLM jobs'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                          <p className="text-slate-400 text-xs">Average rating</p>
                          <p className="text-white text-lg font-semibold">{Number(selectedDetail?.summary?.avg_rating ?? selectedContributor.avg_rating ?? 0).toFixed(2)}</p>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                          <p className="text-slate-400 text-xs">Jobs completed</p>
                          <p className="text-white text-lg font-semibold">{selectedDetail?.summary?.total_jobs_completed ?? selectedContributor.total_jobs_completed ?? 0}</p>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                          <p className="text-slate-400 text-xs">Total earnings</p>
                          <p className="text-white text-lg font-semibold">{Number(selectedDetail?.summary?.total_earnings_eth ?? selectedContributor.total_earnings_eth ?? 0).toFixed(4)} POL</p>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                          <p className="text-slate-400 text-xs">Ratings</p>
                          <p className="text-white text-lg font-semibold">{selectedDetail?.summary?.rating_count ?? selectedContributor.rating_count ?? 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-2 text-emerald-200">
                        <Clock size={16} />
                        <h4 className="font-semibold">Latest Contributions</h4>
                      </div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {(selectedDetail?.history || []).length === 0 ? (
                          <div className="rounded-2xl bg-slate-950/40 border border-white/10 p-4 text-sm text-slate-400">
                            No contribution history available yet.
                          </div>
                        ) : (
                          selectedDetail.history.map((entry) => (
                            <div key={`${entry.job_id}-${entry.created_at}`} className="rounded-2xl bg-slate-950/40 border border-white/10 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-white font-medium">Job #{entry.job_id}</p>
                                  <p className="text-xs text-slate-400 mt-1">{entry.job_type || 'job'} • {entry.contribution_status}</p>
                                </div>
                                <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                                  {Number(entry.reward_earned || 0).toFixed(4)} POL
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-3">Updated {formatDate(entry.completed_at || entry.submitted_at || entry.created_at)}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleSubmitRating} className="rounded-3xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-400/20 p-5 space-y-4">
                      <div className="flex items-center gap-2 text-emerald-200">
                        <MessageSquare size={16} />
                        <h4 className="font-semibold">Leave a rating</h4>
                      </div>

                      {!requestorLoggedIn(userAddress) && (
                        <p className="text-sm text-amber-200 bg-amber-500/10 border border-amber-400/20 rounded-2xl p-3">
                          Log in to submit ratings from the requestor side.
                        </p>
                      )}

                      <div>
                        <label className="block text-sm text-slate-300 mb-2">Job ID from history</label>
                        <select
                          value={ratingJobId}
                          onChange={(event) => setRatingJobId(event.target.value)}
                          className="w-full rounded-2xl bg-slate-950/60 border border-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-400/40"
                        >
                          <option value="">Select a contribution</option>
                          {(selectedDetail?.history || []).map((entry) => (
                            <option key={entry.job_id} value={entry.job_id}>
                              Job #{entry.job_id} - {entry.contribution_status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-300 mb-2">Rating</label>
                        <RatingStars value={ratingValue} onChange={setRatingValue} />
                      </div>

                      <div>
                        <label className="block text-sm text-slate-300 mb-2">Review</label>
                        <textarea
                          value={ratingReview}
                          onChange={(event) => setRatingReview(event.target.value)}
                          rows={4}
                          placeholder="Share specific feedback about quality, responsiveness, or delivery."
                          className="w-full rounded-2xl bg-slate-950/60 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-400/40 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingRating || !requestorLoggedIn(userAddress)}
                        className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-semibold py-3 transition-colors duration-200"
                      >
                        {submittingRating ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </form>
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

function requestorLoggedIn(userAddress) {
  return Boolean(userAddress || localStorage.getItem('userAddress'));
}