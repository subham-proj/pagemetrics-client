import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createAuthAxios, createAsyncThunkErrorHandler } from '@/lib/api';
import { 
  ANALYTICS_OVERVIEW_ENDPOINT, 
  ANALYTICS_TOP_PAGES_ENDPOINT, 
  ANALYTICS_TOP_REFERRERS_ENDPOINT 
} from '@/lib/constants';

// Check if data is stale (older than 5 minutes)
const isDataStale = (lastFetched) => {
  if (!lastFetched) return true;
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  return lastFetched < fiveMinutesAgo;
};

// Fetch overview analytics
export const fetchOverview = createAsyncThunk(
  'analytics/fetchOverview',
  async ({ projectId, from, to, force = false }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { overview, lastFetched, currentProjectId, lastFrom, lastTo } = state.overview;
      
      // Don't fetch if we have recent data for the same project and date range, unless forced
      if (
        !force &&
        overview && 
        currentProjectId === projectId &&
        lastFrom === from &&
        lastTo === to &&
        !isDataStale(lastFetched)
      ) {
        return overview;
      }

      const authAxios = createAuthAxios();
      const response = await authAxios.get(ANALYTICS_OVERVIEW_ENDPOINT(projectId, from, to));
      return response.data;
    } catch (error) {
      return rejectWithValue(createAsyncThunkErrorHandler(error));
    }
  }
);

// Fetch top pages
export const fetchTopPages = createAsyncThunk(
  'analytics/fetchTopPages',
  async ({ projectId, limit = 5, force = false }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { topPages, lastFetched, currentProjectId } = state.overview;
      
      // Don't fetch if we have recent data for the same project, unless forced
      if (
        !force &&
        topPages.length > 0 && 
        currentProjectId === projectId &&
        !isDataStale(lastFetched)
      ) {
        return topPages;
      }

      const authAxios = createAuthAxios();
      const response = await authAxios.get(ANALYTICS_TOP_PAGES_ENDPOINT(projectId, limit));
      return response.data;
    } catch (error) {
      return rejectWithValue(createAsyncThunkErrorHandler(error));
    }
  }
);

// Fetch top referrers
export const fetchTopReferrers = createAsyncThunk(
  'analytics/fetchTopReferrers',
  async ({ projectId, limit = 5, force = false }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { topReferrers, lastFetched, currentProjectId } = state.overview;
      
      // Don't fetch if we have recent data for the same project, unless forced
      if (
        !force &&
        topReferrers.length > 0 && 
        currentProjectId === projectId &&
        !isDataStale(lastFetched)
      ) {
        return topReferrers;
      }

      const authAxios = createAuthAxios();
      const response = await authAxios.get(ANALYTICS_TOP_REFERRERS_ENDPOINT(projectId, limit));
      return response.data;
    } catch (error) {
      return rejectWithValue(createAsyncThunkErrorHandler(error));
    }
  }
);

const initialState = {
  overview: null,
  topPages: [],
  topReferrers: [],
  loading: false,
  error: null,
  lastFetched: null,
  currentProjectId: null,
  lastFrom: null, // store last used from date
  lastTo: null,   // store last used to date
};

const analyticsOverviewSlice = createSlice({
  name: 'overview',
  initialState,
  reducers: {
    clearAnalytics: (state) => {
      state.overview = null;
      state.topPages = [];
      state.topReferrers = [];
      state.error = null;
      state.lastFetched = null;
      state.currentProjectId = null;
      state.lastFrom = null;
      state.lastTo = null;
    },
    setCurrentProject: (state, action) => {
      // If the project is actually changing, clear all data
      if (state.currentProjectId !== action.payload) {
        state.overview = null;
        state.topPages = [];
        state.topReferrers = [];
        state.error = null;
        state.lastFetched = null;
        state.lastFrom = null;
        state.lastTo = null;
      }
      state.currentProjectId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Overview
      .addCase(fetchOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
        state.error = null;
        state.lastFetched = Date.now();
        // Store the last used date range
        if (action.meta && action.meta.arg) {
          state.lastFrom = action.meta.arg.from;
          state.lastTo = action.meta.arg.to;
        }
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Top Pages
      .addCase(fetchTopPages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopPages.fulfilled, (state, action) => {
        state.loading = false;
        state.topPages = action.payload;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(fetchTopPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Top Referrers
      .addCase(fetchTopReferrers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopReferrers.fulfilled, (state, action) => {
        state.loading = false;
        state.topReferrers = action.payload;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(fetchTopReferrers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAnalytics, setCurrentProject } = analyticsOverviewSlice.actions;
export default analyticsOverviewSlice.reducer; 