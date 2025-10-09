import React from 'react';
import TopToast from '../components/TopToast';

type ToastContextValue = {
  show: (message: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const TopToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = React.useState<string | null>(null);
  const [visible, setVisible] = React.useState(false);

  const show = (msg: string) => {
    setMessage(msg);
    setVisible(true);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <TopToast
        message={message}
        visible={visible}
        onHidden={() => {
          setVisible(false);
          setMessage(null);
        }}
      />
    </ToastContext.Provider>
  );
};

export const useTopToast = () => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useTopToast must be used within TopToastProvider');
  return ctx;
};

export default useTopToast;
