export const TraderHero = ({ usuario, totalTrades }) => {
  // Fallback de seguridad en caso de que la URL de la imagen falle
  const defaultAvatar = "https://ui-avatars.com/api/?name=Trader&background=random";

  return (
    <section className="relative mb-12">
      <div className="h-48 w-full rounded-2xl overflow-hidden mb-[-4rem] bg-gradient-to-br from-brand-surface to-brand-dark opacity-50" />
      <div className="flex flex-col items-end gap-6 px-6">
        <div className="relative">
          <img 
            src={usuario.avatar_url || defaultAvatar} 
            alt={usuario.nombre_completo} 
            className="w-32 h-32 rounded-3xl border-4 border-brand-dark shadow-2xl object-cover bg-brand-surface" 
          />
          {usuario.activo && (
            <div className="absolute -bottom-2 -right-2 bg-brand-primary text-brand-dark px-2 py-0.5 rounded-lg font-bold text-xs flex items-center gap-1 shadow-lg">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              {usuario.tipo_usuario}
            </div>
          )}
        </div>
        
        <div className="flex-1 pb-2 w-full">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            {usuario.nombre_completo}
          </h2>
          <div className="flex items-center gap-4 mt-2 text-slate-400 font-medium">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-brand-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-white">{usuario.reputacion_promedio}</span>
            </div>
            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
            <div className="text-white">{totalTrades} trades</div>
            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
            <div className="text-slate-400 text-sm">{usuario.ubicacion}</div>
          </div>
        </div>

        <button className="w-full px-8 py-3 bg-brand-primary text-brand-dark font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-xl">call</span> Contactar
        </button>
      </div>
    </section>
  );
};