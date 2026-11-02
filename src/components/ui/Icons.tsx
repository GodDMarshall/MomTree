type P = { className?: string };

export function ArrowRight({ className = "btn-arrow" }: P) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M1 8h13M9.5 3.5 14 8l-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowDown({ className = "w-4 h-4" }: P) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M8 1v13M3.5 9.5 8 14l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Plus({ className = "w-4 h-4" }: P) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M8 2v12M2 8h12" strokeLinecap="round" />
    </svg>
  );
}

export function Phone({ className = "w-4 h-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path
        d="M5 3.5h3.2l1.6 4.2-2 1.4a12 12 0 0 0 7.1 7.1l1.4-2 4.2 1.6V19a1.6 1.6 0 0 1-1.7 1.6C10.4 20 4 13.6 3.4 5.2A1.6 1.6 0 0 1 5 3.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Mail({ className = "w-4 h-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinejoin="round" />
    </svg>
  );
}

export function Pin({ className = "w-4 h-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function WhatsApp({ className = "w-5 h-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12.04 2.5a9.43 9.43 0 0 0-8.1 14.27L2.5 21.5l4.86-1.4a9.44 9.44 0 1 0 4.68-17.6Zm0 17.2a7.77 7.77 0 0 1-3.96-1.09l-.28-.17-2.88.83.85-2.8-.19-.29a7.78 7.78 0 1 1 6.46 3.52Zm4.27-5.83c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.53.12-.15.23-.6.76-.74.92-.14.15-.27.17-.5.06a6.37 6.37 0 0 1-3.17-2.77c-.24-.41.24-.38.69-1.28.08-.15.04-.29-.02-.4-.06-.12-.53-1.27-.72-1.74-.19-.46-.38-.39-.53-.4h-.45a.86.86 0 0 0-.62.29 2.6 2.6 0 0 0-.81 1.93 4.52 4.52 0 0 0 .94 2.4 10.33 10.33 0 0 0 3.96 3.5c1.47.63 2.05.69 2.78.58.45-.07 1.38-.56 1.57-1.11.2-.55.2-1.02.14-1.11-.06-.1-.21-.16-.44-.27Z" />
    </svg>
  );
}

export function Instagram({ className = "w-5 h-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Close({ className = "w-5 h-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M5 5l14 14M19 5 5 19" strokeLinecap="round" />
    </svg>
  );
}
