'use client';

import React from 'react';

interface ConfirmButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  confirmMessage?: string;
  children: React.ReactNode;
}

export function ConfirmButton({ confirmMessage, children, onClick, ...props }: ConfirmButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (confirmMessage && !confirm(confirmMessage)) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };

  return (
    <button {...props} onClick={handleClick}>
      {children}
    </button>
  );
}
