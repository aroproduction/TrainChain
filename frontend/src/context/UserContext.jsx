// context/UserContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userAddress, setUserAddress] = useState(null);
  const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    const address = localStorage.getItem('userAddress');
    if (address) {
      setUserAddress(address);
    }
    setLoading(false); // Set loading to false after fetching data
  }, []);

  const saveAddress = (address) => {
    localStorage.setItem('userAddress', address);
    setUserAddress(address);
  };

  const clearAddress = () => {
    localStorage.removeItem('userAddress');
    setUserAddress(null);
  };

  return (
    <UserContext.Provider value={{ userAddress, saveAddress, clearAddress, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
