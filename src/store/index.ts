import { configureStore } from '@reduxjs/toolkit';
import gistReducer from './gistSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
    reducer: {
        gist: gistReducer,
        settings: settingsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
