import React, { createContext, useContext, useState, useMemo } from 'react';
import { lightColors, darkColors } from '../theme/colors';
import { walks as initialWalks, initialRsvps, currentUser as initialUser, dogs as initialDogs } from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [walks, setWalks] = useState(initialWalks);
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [user, setUser] = useState(initialUser);
  const [dogs, setDogs] = useState(initialDogs);
  const [isDark, setIsDark] = useState(false);

  const colors = useMemo(() => isDark ? darkColors : lightColors, [isDark]);
  const toggleTheme = () => setIsDark(d => !d);

  const updateUser = (fields) => setUser((u) => ({ ...u, ...fields }));

  const updateDog = (dogId, fields) =>
    setDogs((prev) => prev.map((d) => (d.id === dogId ? { ...d, ...fields } : d)));

  const addDog = (dogData) =>
    setDogs((prev) => [...prev, { ...dogData, id: `dog-${Date.now()}`, ownerId: 'user-1' }]);

  const isRsvpd = (walkId) =>
    rsvps.some((r) => r.walkId === walkId && r.userId === 'user-1' && r.status === 'going');

  const toggleRsvp = (walkId) => {
    const existing = rsvps.find((r) => r.walkId === walkId && r.userId === 'user-1');
    if (existing) {
      setRsvps((prev) => prev.filter((r) => !(r.walkId === walkId && r.userId === 'user-1')));
      setWalks((prev) =>
        prev.map((w) => (w.id === walkId ? { ...w, attendeeCount: w.attendeeCount - 1 } : w))
      );
    } else {
      setRsvps((prev) => [
        ...prev,
        { id: `rsvp-${Date.now()}`, walkId, userId: 'user-1', status: 'going' },
      ]);
      setWalks((prev) =>
        prev.map((w) => (w.id === walkId ? { ...w, attendeeCount: w.attendeeCount + 1 } : w))
      );
    }
  };

  const addWalk = (walkData) => {
    const newWalk = {
      ...walkData,
      id: `walk-${Date.now()}`,
      organizerId: 'user-1',
      organizerName: 'Peter van den Berg',
      attendeeCount: 1,
      status: 'active',
    };
    setWalks((prev) => [newWalk, ...prev]);
    setRsvps((prev) => [
      ...prev,
      { id: `rsvp-${Date.now()}`, walkId: newWalk.id, userId: 'user-1', status: 'going' },
    ]);
    return newWalk;
  };

  return (
    <AppContext.Provider value={{
      walks, rsvps, isRsvpd, toggleRsvp, addWalk,
      user, dogs, updateUser, updateDog, addDog,
      isDark, toggleTheme, colors,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
export const useColors = () => useContext(AppContext).colors;
