import { useTraderData } from '../hooks/useTraderData';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { TraderHero } from '../components/profile/TraderHero';
import { TradeItem } from '../components/profile/TradeItem';

const TraderProfile = () => {
  const { usuario, cartasOfreciendo, loading, error } = useTraderData();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-brand-primary font-bold">
        Sincronizando sistema...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-red-500 font-bold">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-brand-dark min-h-screen text-white pb-24 antialiased">
      <Header title="Trader Profile" />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Pasamos los datos anidados de forma segura */}
        <TraderHero 
          usuario={usuario} 
          totalTrades={usuario.stats?.total_trades || 0} 
        />

        {/* Sistema de Pestañas */}
        <div className="flex border-b border-brand-border mb-8">
          <button className="px-8 py-4 text-brand-primary border-b-2 border-brand-primary font-bold text-sm">
            Ofreciendo
          </button>
          <button className="px-8 py-4 text-slate-400 font-bold text-sm hover:text-white transition-all">
            Buscando
          </button>
        </div>

        {/* Sección de Inventario */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary">storefront</span>
              Ofreciendo
            </h3>
            <span className="text-slate-400 text-sm font-medium">
              {cartasOfreciendo.length} Items
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {cartasOfreciendo.map((carta) => (
              <TradeItem key={carta.id_carta} carta={carta} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav active="profile" />
    </div>
  );
};

export default TraderProfile;