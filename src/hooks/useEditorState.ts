import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Editor } from '@tiptap/react';
import { saveToGist } from '../store/gistSlice';
import type { RootState, AppDispatch } from '../store';
import { SecureStorage } from '../utils/SecureStorage';
import { generateKey } from '../utils/Crypto';
import { updateSettings, setSettings } from '../store/settingsSlice';

const debounce = (fn: Function, ms: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
};

export const useEditorState = (
    editor: Editor | null,
    isLocked: boolean
) => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { githubToken, gistId } = useSelector((state: RootState) => state.gist);
    const settings = useSelector((state: RootState) => state.settings);

    const [isSaving, setIsSaving] = React.useState(false);
    const [needsToken, setNeedsToken] = React.useState(false);
    const [payloadSize, setPayloadSize] = React.useState(0);
    const [count, setCount] = React.useState({ chars: 0, words: 0 });

    const innerKeyRef = React.useRef<CryptoKey | null>(null);
    const outerKeyRef = React.useRef<CryptoKey | null>(null);
    const lastSaveTimestamp = React.useRef(0);

    const saveChanges = React.useCallback(async (html: string, overrides?: { forceProtected?: boolean, forceSalt?: string }) => {
        const startTimestamp = Date.now();
        const isProtected = overrides?.forceProtected !== undefined ? overrides.forceProtected : settings.mode === "protected";
        const saltToUse = overrides?.forceSalt !== undefined ? overrides.forceSalt : settings.s;

        if (isLocked && !overrides?.forceProtected) return;

        setIsSaving(true);
        try {
            console.log(`[STEP 0] [useEditorState.ts:37] saveChanges: Initiating save. Protected: ${isProtected}`);
            
            // 1. Ensure keys exist
            if (!innerKeyRef.current) {
                if (isProtected) {
                    console.warn(`[DEBUG] [useEditorState.ts:42] saveChanges: innerKey missing in PROTECTED mode. No-op or wait for derivation.`);
                    // In protected mode, we can't just generate a random key.
                    // However, if we just finished setup, the key should have been set.
                    if (!overrides?.forceProtected) {
                         setIsSaving(false);
                         return;
                    }
                }
                innerKeyRef.current = await generateKey();
                console.log(`[DEBUG] [useEditorState.ts:51] saveChanges: Generated new random innerKey.`);
            }
            if (!outerKeyRef.current) {
                outerKeyRef.current = await generateKey();
                console.log(`[DEBUG] [useEditorState.ts:55] saveChanges: Generated new outerKey.`);
            }

            // 2. Multi-layer Encryption (V2)
            const result = await SecureStorage.v2Encrypt(
                html,
                innerKeyRef.current,
                { ...settings, mode: isProtected ? "protected" : "open", s: saltToUse || "" },
                outerKeyRef.current,
                async (encryptedContent: string) => {
                    console.log(`[STEP 3.1] [useEditorState.ts:54] saveChanges (Gist Callback): Content too large, uploading to Gist.`);
                    const resultAction = await dispatch(saveToGist({
                        content: encryptedContent,
                        token: githubToken || "",
                        gistId: gistId
                    }));

                    if (saveToGist.fulfilled.match(resultAction)) {
                        console.log(`[STEP 3.2] [useEditorState.ts:62] saveChanges (Gist Callback): Gist upload successful. Gid: ${resultAction.payload}`);
                        setNeedsToken(false);
                        return resultAction.payload as string;
                    } else {
                        console.error(`[ERROR] [useEditorState.ts:66] saveChanges (Gist Callback): Gist upload failed.`);
                        if (!githubToken) setNeedsToken(true);
                        throw new Error("Gist save failed");
                    }
                }
            );

            const { hash: newHash, settings: newSettings } = result;

            if (startTimestamp < lastSaveTimestamp.current) {
                console.warn(`[DEBUG] [useEditorState.ts:74] saveChanges: Discarding stale save (timestamp drift).`);
                return;
            }

            // Sync Redux with the latest encryption metadata
            console.log(`[STATE-SYNC] saveChanges: Dispatching setSettings. 
                Storage: ${newSettings.storageType}
                D-Length: ${newSettings.d.length}
                IV: ${newSettings.iv}
                Gid-IV: ${newSettings.iv_gist}`);
            dispatch(setSettings(newSettings));
            console.log(`[STATE-SYNC] saveChanges: Redux dispatch complete.`);

            const cleanFilename = settings.fileName.trim().replace(/\s+/g, '-');
            console.log(`[STEP 10] [useEditorState.ts:79] saveChanges: Updating URL with new hash.`);

            if (!isLocked || overrides?.forceProtected) {
                navigate(`/${cleanFilename}#${newHash}`, { replace: true });
                lastSaveTimestamp.current = startTimestamp;
            }
        } catch (err) {
            console.error("[Save] V2 Process failed:", err);
        } finally {
            setIsSaving(false);
        }

        if (editor) {
            setCount({
                chars: editor.storage.characterCount.characters(),
                words: editor.storage.characterCount.words()
            });
        }
    }, [settings, githubToken, gistId, isLocked, editor, dispatch, navigate]);

    const debouncedSave = React.useMemo(() => debounce((html: string) => saveChanges(html), 800), [saveChanges]);

    return {
        filename: settings.fileName,
        setFilename: (name: string) => {
            dispatch(updateSettings({ fileName: name }));
            const cleanName = name.trim().replace(/\s+/g, '-');
            const currentHash = window.location.hash;
            navigate(`/${cleanName}${currentHash}`, { replace: true });
        },
        isSaving, setIsSaving,
        needsToken, setNeedsToken,
        payloadSize, setPayloadSize,
        count, setCount,
        innerKeyRef,
        outerKeyRef,
        saveChanges,
        debouncedSave
    };
};
