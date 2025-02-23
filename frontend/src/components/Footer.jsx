import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 text-gray-600 py-4 text-center">
    &copy; {new Date().getFullYear()} &copy;TrainChain . All rights reserved.
  </footer>
  );
};

export default Footer;