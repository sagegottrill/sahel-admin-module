import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { demoStore } from '../lib/demoStore';
import { isDemoMode } from '../lib/demoMode';

export type AuthUser = { uid: string; email: string } | null;

interface AuthContextType {
    user: AuthUser;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isDemoMode() || !auth) {
            const sync = () => {
                setUser(demoStore.getUser());
                setLoading(false);
            };
            sync();
            window.addEventListener('srs-demo-auth', sync);
            window.addEventListener('storage', sync);
            return () => {
                window.removeEventListener('srs-demo-auth', sync);
                window.removeEventListener('storage', sync);
            };
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
            if (!fbUser?.uid || !fbUser.email) {
                setUser(null);
            } else {
                setUser({ uid: fbUser.uid, email: fbUser.email });
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        if (isDemoMode() || !auth) {
            demoStore.setUser(null);
            setUser(null);
            return;
        }
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
