import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { storage, DEFAULT_STATE } from '../utils/storage';
import { calculateBaseline, calculateStreak, getMonthlyCategoryBreakdown, getWeeklyTrend } from '../utils/emissions';
import { sanitizeLogEntry } from '../utils/sanitize';
import { BADGES } from '../data/constants';

const AppContext = createContext(null);

// ─── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };

    case 'COMPLETE_ONBOARDING': {
      const baseline = calculateBaseline(action.payload);
      return {
        ...state,
        profile: action.payload,
        baseline: baseline.total,
        baselineBreakdown: baseline.breakdown,
        onboardingComplete: true,
      };
    }

    case 'ADD_LOG': {
      const newLogs = [action.payload, ...state.dailyLogs];
      return { ...state, dailyLogs: newLogs };
    }

    case 'REMOVE_LOG': {
      const newLogs = state.dailyLogs.filter((l) => l.id !== action.payload);
      return { ...state, dailyLogs: newLogs };
    }

    case 'COMMIT_ACTION': {
      const already = state.committedActions.find((a) => a.tipId === action.payload.tipId);
      if (already) return state;
      return {
        ...state,
        committedActions: [...state.committedActions, { ...action.payload, date: new Date().toISOString() }],
      };
    }

    case 'UNCOMMIT_ACTION': {
      return {
        ...state,
        committedActions: state.committedActions.filter((a) => a.tipId !== action.payload),
      };
    }

    case 'COMPLETE_CHALLENGE': {
      if (state.completedChallenges.includes(action.payload)) return state;
      return {
        ...state,
        completedChallenges: [...state.completedChallenges, action.payload],
      };
    }

    case 'EARN_BADGE': {
      if (state.badges.includes(action.payload)) return state;
      return { ...state, badges: [...state.badges, action.payload] };
    }

    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };

    case 'SET_GOOGLE_MAPS_KEY':
      return { ...state, googleMapsKey: action.payload };

    case 'SET_GEMINI_KEY':
      return { ...state, geminiKey: action.payload };

    case 'SET_AI_PROVIDER':
      return { ...state, aiProvider: action.payload };

    case 'RESET':
      return { ...DEFAULT_STATE };

    case 'HYDRATE':
      return { ...DEFAULT_STATE, ...action.payload };

    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE, () => {
    const saved = storage.get();
    return saved ? { ...DEFAULT_STATE, ...saved } : DEFAULT_STATE;
  });

  // Persist to localStorage on every state change
  useEffect(() => {
    storage.set(state);
  }, [state]);

  // Badge evaluation — wrapped in try/catch to guard against bad criteria functions
  useEffect(() => {
    BADGES.forEach((badge) => {
      try {
        if (!state.badges.includes(badge.id) && badge.criteria(state)) {
          dispatch({ type: 'EARN_BADGE', payload: badge.id });
        }
      } catch {
        // silently ignore criteria evaluation failures
      }
    });
  }, [state]);

  // ─── Computed Values (memoised to avoid re-computation on unrelated renders) ─
  const streak = useMemo(() => calculateStreak(state.dailyLogs), [state.dailyLogs]);

  const categoryBreakdown = useMemo(
    () => getMonthlyCategoryBreakdown(state.dailyLogs, state.baseline),
    [state.dailyLogs, state.baseline]
  );

  const monthlyFootprint = useMemo(
    () => categoryBreakdown.reduce((sum, c) => sum + c.value, 0),
    [categoryBreakdown]
  );

  const weeklyTrend = useMemo(() => getWeeklyTrend(state.dailyLogs), [state.dailyLogs]);

  const totalSavings = useMemo(
    () => state.committedActions.reduce((sum, a) => sum + (a.saving || 0), 0),
    [state.committedActions]
  );

  // ─── Actions ──────────────────────────────────────────────────────────────
  const completeOnboarding = useCallback((profileData) => {
    dispatch({ type: 'COMPLETE_ONBOARDING', payload: profileData });
  }, []);

  const addLog = useCallback((entry) => {
    // Sanitize entry fields before storing to prevent data corruption
    const safe = sanitizeLogEntry(entry);
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      ...safe,
    };
    dispatch({ type: 'ADD_LOG', payload: log });
  }, []);

  const removeLog = useCallback((id) => {
    dispatch({ type: 'REMOVE_LOG', payload: id });
  }, []);

  const commitAction = useCallback((tip) => {
    if (!tip?.id) return;
    dispatch({
      type: 'COMMIT_ACTION',
      payload: { tipId: tip.id, title: tip.title || '', saving: tip.monthlySaving || 0 },
    });
  }, []);

  const uncommitAction = useCallback((tipId) => {
    dispatch({ type: 'UNCOMMIT_ACTION', payload: tipId });
  }, []);

  const completeChallenge = useCallback((challengeId) => {
    dispatch({ type: 'COMPLETE_CHALLENGE', payload: challengeId });
  }, []);

  const setApiKey = useCallback((key) => {
    dispatch({ type: 'SET_API_KEY', payload: key });
  }, []);

  const setGoogleMapsKey = useCallback((key) => {
    dispatch({ type: 'SET_GOOGLE_MAPS_KEY', payload: key });
  }, []);

  const setGeminiKey = useCallback((key) => {
    dispatch({ type: 'SET_GEMINI_KEY', payload: key });
  }, []);

  const setAiProvider = useCallback((provider) => {
    dispatch({ type: 'SET_AI_PROVIDER', payload: provider });
  }, []);

  const resetApp = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <AppContext.Provider
      value={{
        // State
        ...state,
        // Computed
        streak,
        categoryBreakdown,
        monthlyFootprint,
        weeklyTrend,
        totalSavings,
        // Actions
        completeOnboarding,
        addLog,
        removeLog,
        commitAction,
        uncommitAction,
        completeChallenge,
        setApiKey,
        setGoogleMapsKey,
        setGeminiKey,
        setAiProvider,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
