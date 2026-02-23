import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { INoteAppSettings } from '../types/Types';

const initialState: INoteAppSettings = {
    v: 2,
    mode: "open",
    accesibility: "editable",
    storageType: "url",
    fileName: "Untitled",
    d: "",
    iv: "",
    s: "",
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        updateSettings: (state, action: PayloadAction<Partial<INoteAppSettings>>) => {
            return { ...state, ...action.payload };
        },
        setSettings: (_state, action: PayloadAction<INoteAppSettings>) => {
            return action.payload;
        },
    },
});

export const { updateSettings, setSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
