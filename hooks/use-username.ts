import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UseUsernameProps {
    username: string;
    setUsername: (username: string) => void;
    clearUsername: () => void;
}

export const useUsername = create<UseUsernameProps>()(
    persist(
        (set) => ({
            username: "",
            setUsername: (username) => set({ username }),
            clearUsername: () => set({ username: "" }),
        }),
        {
            name: "user-storage",
        }
    )
);
