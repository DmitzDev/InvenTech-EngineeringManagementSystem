import React from 'react';

export default function TouchButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  icon: Icon,
  className = '',
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeStyles = {
    sm: 'min-h-[42px] px-3.5 py-1.5 text-xs gap-2',
    md: 'min-h-[48px] px-5 py-2.5 text-sm gap-2.5',
    lg: 'min-h-[54px] px-6 py-3 text-base gap-3',
    xl: 'min-h-[62px] px-8 py-3.5 text-lg font-bold gap-3.5',
  };

  const variantStyles = {
    primary: 'neu-btn-primary',
    secondary: 'neu-btn-raised text-slate-200',
    success:
      'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-[4px_4px_12px_#060a12,-4px_-4px_12px_#1a2844,0_0_16px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-[0.98]',
    danger: 'neu-btn-danger',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white active:scale-[0.98]',
    outline:
      'neu-card-sm hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 active:scale-[0.98]',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}
