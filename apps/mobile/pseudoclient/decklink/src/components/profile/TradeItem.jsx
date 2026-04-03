export const TradeItem = ({ carta }) => {
  const renderBadge = () => {
    if (carta.esta_gradeado) {
      return `${carta.compania_grading} ${carta.puntaje_grading}`;
    }
    return "RAW";
  };

  const isGradeado = carta.esta_gradeado;

  return (
    <div className="glass-panel p-2 rounded-xl group hover:border-brand-primary/50 transition-colors cursor-pointer">
      <div className="aspect-square rounded-lg overflow-hidden mb-2 relative">
        <img 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          src={carta.imagen_url} 
          alt={carta.nombre} 
        />
        <div className={`absolute top-1 right-1 bg-brand-dark/80 backdrop-blur-md px-1 py-0.5 rounded text-[8px] font-bold border ${
          isGradeado 
            ? 'text-brand-primary border-brand-primary/30' 
            : 'text-slate-300 border-slate-700'
        }`}>
          {renderBadge()}
        </div>
      </div>
      
      <h4 className="font-bold text-white text-[11px] truncate leading-tight">
        {carta.nombre}
      </h4>
      
      <div className="flex justify-between items-center mt-1">
        <p className="text-brand-primary font-bold text-[10px]">
          {carta.precio_referencia}
        </p>
        <span className="text-[7px] text-slate-500 uppercase tracking-wider">
          {carta.rareza}
        </span>
      </div>
    </div>
  );
};