'use client';

const { useContext, useState, createContext } = require('react');

const ReservationContext = createContext();

const initState = { from: undefined, to: undefined };

const ReservationProvider = ({ children }) => {
  const [range, setRange] = useState(initState);

  const resetRange = () => setRange(initState);

  return (
    <ReservationContext.Provider value={{ range, setRange, resetRange }}>
      {children}
    </ReservationContext.Provider>
  );
};

const useReservation = () => {
  const context = useContext(ReservationContext);

  if (context === undefined)
    throw new Error('Context was used outside provider');

  return context;
};

export { ReservationProvider, useReservation };
