import { useState, useEffect } from 'react';
import { traderService } from '../services/traderService';

export const useTraderData = () => {
  const [data, setData] = useState({ 
    usuario: null, 
    cartasOfreciendo: [], 
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await traderService.getProfileData();
        setData({
          usuario: response.usuario,
          cartasOfreciendo: response.cartas_ofreciendo,
          loading: false,
          error: null
        });
      } catch (err) {
        setData(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Error de sincronización con el servidor.' 
        }));
      }
    };
    
    loadData();
  }, []);

  return data;
};