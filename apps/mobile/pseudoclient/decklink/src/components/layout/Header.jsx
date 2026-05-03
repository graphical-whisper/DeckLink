export const Header = ({ title }) => (
  <header className="bg-brand-dark border-b border-brand-border flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50">
    <div className="flex items-center gap-4">
      <span className="material-symbols-outlined text-white cursor-pointer font-bold">
        arrow_back
      </span>
      <h1 className="text-xl font-bold text-white">{title}</h1>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-white cursor-pointer font-bold">
        more_vert
      </span>
    </div>
  </header>
);