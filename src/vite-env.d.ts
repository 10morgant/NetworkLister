/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Set to 'false' to compile out the Archive/Delete actions on the Review page. */
    readonly VITE_ENABLE_ACTIONS?: string;
}
