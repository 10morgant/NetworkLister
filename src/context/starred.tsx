// src/context/starred.tsx
import {
    createContext,
    useContext,
    useState
} from 'react';

interface StarredContextValue {
    starred: Set<string>;
    toggleStar: (id: string) => void;
}

const StarredContext = createContext<StarredContextValue | null>(null);

export function StarredProvider({children}: { children: React.ReactNode }) {
    const [starred, setStarred] = useState<Set<string>>(
        new Set(['core-1', 'u-1', 'u-2'])
    );

    const toggleStar = (id: string) =>
        setStarred(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });

    return (
        <StarredContext.Provider value={{starred, toggleStar}}>
            {children}
        </StarredContext.Provider>
    );
}

export function useStarred() {
    const ctx = useContext(StarredContext);
    if (!ctx) throw new Error('useStarred must be used within a StarredProvider');
    return ctx;
}