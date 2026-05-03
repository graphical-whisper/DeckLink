import mockData from '../assets/data/db.json';

export const traderService = {
  getProfileData: async () => {
    return new Promise((resolve) => {
      // Simulación de latencia de red (500ms)
      setTimeout(() => {
        resolve(mockData);
      }, 500);
    });
  }
};