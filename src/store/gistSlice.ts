// src/store/gistSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { createGist, getGist } from '../utils/Gist';

interface GistState {
    gistId: string | null;
    githubToken: string | null;
    loading: boolean;
    error: string | null;
    gistData: string | null;
}

const initialState: GistState = {
    gistId: null,
    githubToken: localStorage.getItem('obscura_github_token'),
    loading: false,
    error: null,
    gistData: null,
};

export const saveToGist = createAsyncThunk(
    'gist/save',
    async ({ content, token, callbackfn }: { content: string; token: string, callbackfn?: (params: any) => any }, { rejectWithValue }) => {
        try {
            console.log("[Redux] Saving to Gist... Content length:", content.length);
            const response = await createGist(content, token);
            console.log("[Redux] Gist created successfully. Response:", response.status, response.data.id);
            if (callbackfn) callbackfn(response);
            return response.data.id;
        } catch (error: any) {
            console.error("[Redux] Gist save failed:", error.response?.data || error.message);
            return rejectWithValue(error.message || 'Failed to save to Gist');
        }
    }
);

export const fetchFromGist = createAsyncThunk(
    'gist/fetch',
    async ({ gistId, token }: { gistId: string; token?: string }, { rejectWithValue }) => {
        try {
            console.log("[Redux] Fetching Gist:", gistId);
            const content = await getGist(gistId, token);
            console.log("[Redux] Gist fetched successfully. Content length:", content.length);
            return content;
        } catch (error: any) {
            console.error("[Redux] Gist fetch failed:", error.response?.data || error.message);
            return rejectWithValue(error.message || 'Failed to fetch from Gist');
        }
    }
);

const gistSlice = createSlice({
    name: 'gist',
    initialState,
    reducers: {
        setGithubToken: (state, action: PayloadAction<string>) => {
            state.githubToken = action.payload;
        },
        clearGistError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Save to Gist
            .addCase(saveToGist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveToGist.fulfilled, (state, action) => {
                state.loading = false;
                state.gistId = action.payload;
            })
            .addCase(saveToGist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch from Gist
            .addCase(fetchFromGist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFromGist.fulfilled, (state, action) => {
                state.loading = false;
                state.gistData = action.payload;
            })
            .addCase(fetchFromGist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setGithubToken, clearGistError } = gistSlice.actions;
export default gistSlice.reducer;
