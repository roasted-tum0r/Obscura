export interface INoteAppSettings {
    v: number;
    mode: "open" | "protected";
    accesibility: "editable" | "read-only";
    storageType: "url" | "gist";
    fileName: string;
    d: string;
    iv: string;
    iv_gist?: string;
    s: string;
    k_inner?: string;
}
