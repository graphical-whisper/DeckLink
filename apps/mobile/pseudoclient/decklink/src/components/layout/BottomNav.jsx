export const BottomNav = ({ active = 'profile' }) => {
  const navItems = [
    { id: 'market', icon: 'storefront', label: 'Market' },
    { id: 'trades', icon: 'swap_horiz', label: 'Trades' },
    { id: 'chat', icon: 'forum', label: 'Chat' },
    { id: 'profile', icon: 'person', label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 px-4 bg-brand-dark border-t border-brand-border shadow-lg">
      {navItems.map(item => {
        const isActive = active === item.id;
        return (
          <div 
            key={item.id}
            className={`flex flex-col items-center justify-center transition-colors ${
              isActive 
                ? 'text-brand-primary px-3 py-1 rounded-xl' 
                : 'text-slate-500 hover:text-brand-primary'
            }`}
          >
            <span 
              className="material-symbols-outlined" 
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="text-[11px] font-medium">{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};