import { useState } from 'react';
import { Sparkles, AlertCircle, Key, RefreshCw, CheckCircle2, Target } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useApp } from '../context/AppContext';
import Layout from '../components/layout/Layout';
import TipCard from '../components/cards/TipCard';
import { generateTips, FALLBACK_TIPS } from '../utils/claude';
import { generateTipsGemini } from '../utils/gemini';
import { CHALLENGES, CATEGORY_COLORS } from '../data/constants';

const DIFF_STYLES = {
  Easy: 'diff-easy',
  Medium: 'diff-medium',
  Hard: 'diff-hard',
};

export default function Insights() {
  const {
    apiKey, geminiKey, aiProvider,
    categoryBreakdown, profile, baseline,
    committedActions, commitAction, uncommitAction,
    completedChallenges, completeChallenge,
  } = useApp();

  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(false);

  const topCategories = [...categoryBreakdown]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (aiProvider === 'gemini') {
        result = await generateTipsGemini({ profile, baseline, topCategories, geminiKey });
      } else {
        result = await generateTips({ profile, baseline, topCategories, apiKey });
      }
      setTips(result);
      setGenerated(true);
    } catch (err) {
      if (err.message === 'NO_API_KEY') {
        setError('no_key');
      } else if (err.message === 'INVALID_API_KEY') {
        setError('invalid_key');
      } else {
        setError('generic');
      }
      // Show fallback tips
      setTips(FALLBACK_TIPS);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const isCommitted = (tipId) => committedActions.some((a) => a.tipId === tipId);

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-offwhite mb-1">Insights &amp; Actions</h1>
        <p className="text-[rgba(248,249,250,0.5)] text-sm">AI-powered tips personalized to your emission profile</p>
      </div>

      {/* Top Categories Summary */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-offwhite mb-4 flex items-center gap-2">
          <Target size={16} className="text-mint" />
          Your Top Emission Sources
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {topCategories.map((cat, i) => (
            <div
              key={cat.name}
              className="text-center p-3 rounded-xl"
              style={{
                background: `${CATEGORY_COLORS[cat.name] || '#52B788'}15`,
                border: `1px solid ${CATEGORY_COLORS[cat.name] || '#52B788'}30`,
              }}
            >
              <p className="text-2xl mb-1">{i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉'}</p>
              <p
                className="text-sm font-semibold capitalize"
                style={{ color: CATEGORY_COLORS[cat.name] || '#52B788' }}
              >
                {cat.name}
              </p>
              <p className="text-xs text-[rgba(248,249,250,0.5)]">{cat.value} kg/mo</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Tips Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-offwhite flex items-center gap-2">
            <Sparkles size={18} className="text-mint" />
            AI-Powered Tips
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[rgba(82,183,136,0.15)] text-mint border border-[rgba(82,183,136,0.3)]">
              {aiProvider === 'gemini' ? 'Gemini 1.5' : 'Claude 3.5'}
            </span>
          </h2>
          {generated && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-mint border border-mint/30 hover:border-mint px-3 py-1.5 rounded-lg transition-all"
              aria-label="Regenerate AI tips"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Regenerate
            </button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-[rgba(244,162,97,0.1)] border border-[rgba(244,162,97,0.3)] flex items-start gap-3" role="alert">
            {error === 'no_key' ? <Key size={16} className="text-amber-carbon mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="text-amber-carbon mt-0.5 flex-shrink-0" />}
            <div>
              {error === 'no_key' && (
                <p className="text-sm text-amber-carbon">
                  <strong>No API key found.</strong> Showing sample tips below. Add your {aiProvider === 'gemini' ? 'Gemini' : 'Anthropic'} API key in Settings to get personalized tips.
                </p>
              )}
              {error === 'invalid_key' && (
                <p className="text-sm text-amber-carbon">
                  <strong>Invalid API key.</strong> Check your key in Settings and try again. Showing sample tips below.
                </p>
              )}
              {error === 'generic' && (
                <p className="text-sm text-amber-carbon">
                  <strong>API error.</strong> Showing sample tips. Check your internet connection and try again.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Not generated yet */}
        {!generated && !loading && (
          <div className="card p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(82,183,136,0.1)] border border-[rgba(82,183,136,0.2)] flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-mint" />
            </div>
            <h3 className="font-display font-bold text-xl text-offwhite mb-2">Get Personalized Tips</h3>
            <p className="text-[rgba(248,249,250,0.5)] text-sm mb-6 max-w-sm mx-auto">
              {aiProvider === 'gemini' ? 'Gemini AI' : 'Claude AI'} will analyze your emission profile and generate tailored recommendations to reduce your carbon footprint.
            </p>
            <button onClick={handleGenerate} className="btn-primary flex items-center gap-2 mx-auto">
              <Sparkles size={16} />
              Generate My Tips
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4" aria-busy="true" aria-label="Loading personalized tips">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-3/4 mb-2" />
                    <div className="skeleton h-3 w-1/4" />
                  </div>
                </div>
                <div className="skeleton h-3 w-full mb-2" />
                <div className="skeleton h-3 w-5/6 mb-4" />
                <div className="flex justify-between">
                  <div className="skeleton h-8 w-24" />
                  <div className="skeleton h-8 w-28 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        {generated && !loading && (
          <div className="space-y-4">
            {tips.map((tip) => (
              <TipCard
                key={tip.id}
                tip={tip}
                isCommitted={isCommitted(tip.id)}
                onCommit={commitAction}
                onUncommit={uncommitAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Challenges Section */}
      <div>
        <h2 className="font-semibold text-offwhite mb-4 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-mint" />
          Weekly Eco-Challenges
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {CHALLENGES.map((challenge) => {
            const done = completedChallenges.includes(challenge.id);
            const IconComponent = LucideIcons[challenge.icon] || LucideIcons.Leaf;
            const catColor = CATEGORY_COLORS[challenge.category] || '#52B788';

            return (
              <div
                key={challenge.id}
                className={`card p-5 transition-all duration-300 ${done ? 'opacity-80' : ''}`}
                style={{ borderColor: done ? '#52B788' : undefined }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${catColor}22`, border: `1px solid ${catColor}44` }}
                    >
                      <IconComponent size={18} style={{ color: catColor }} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-offwhite text-sm">{challenge.title}</h3>
                      <span className="text-xs text-[rgba(248,249,250,0.4)]">{challenge.duration}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${DIFF_STYLES[challenge.difficulty]}`}>
                    {challenge.difficulty}
                  </span>
                </div>

                <p className="text-sm text-[rgba(248,249,250,0.55)] mb-4">{challenge.description}</p>

                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    <span className="font-bold text-mint">-{challenge.saving} kg</span>
                    <span className="text-[rgba(248,249,250,0.4)] text-xs ml-1">CO₂ saved</span>
                  </p>
                  <button
                    onClick={() => !done && completeChallenge(challenge.id)}
                    disabled={done}
                    aria-pressed={done}
                    aria-label={done ? `${challenge.title} completed` : `Accept challenge: ${challenge.title}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      done
                        ? 'bg-mint/20 text-mint border border-mint/40 cursor-default'
                        : 'btn-secondary text-xs'
                    }`}
                  >
                    {done ? <><CheckCircle2 size={14} /> Done!</> : 'Accept Challenge'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
