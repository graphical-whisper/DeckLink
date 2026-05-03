import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdConfig, AdProvider, AdPlacement } from './entities/ad-config.entity';
import { AdImpression } from './entities/ad-impression.entity';
import { UserAdPreferences } from './entities/user-ad-preferences.entity';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class AdService {
  private readonly logger = new Logger(AdService.name);

  constructor(
    @InjectRepository(AdConfig)
    private adConfigRepository: Repository<AdConfig>,
    @InjectRepository(AdImpression)
    private adImpressionRepository: Repository<AdImpression>,
    @InjectRepository(UserAdPreferences)
    private userAdPreferencesRepository: Repository<UserAdPreferences>,
  ) {}

  async getAdForUser(user: User, placement: AdPlacement): Promise<{ adUnitId: string; provider: AdProvider } | null> {
    try {
      // Verificar si el usuario debe ver anuncios
      if (!(await this.shouldShowAds(user))) {
        return null;
      }

      // Obtener configuración de anuncio activa para este placement
      const adConfig = await this.adConfigRepository.findOne({
        where: { 
          placement, 
          isActive: true 
        }
      });

      if (!adConfig) {
        return null;
      }

      // Verificar frecuencia (cada X acciones)
      const shouldShow = await this.checkAdFrequency(user, placement, adConfig.frequency);
      if (!shouldShow) {
        return null;
      }

      return {
        adUnitId: adConfig.adUnitId,
        provider: adConfig.provider
      };
    } catch (error) {
      this.logger.error(`Error getting ad for user ${user.id}:`, error);
      return null;
    }
  }

  async recordImpression(
    user: User, 
    placement: AdPlacement, 
    adConfig: AdConfig,
    revenue?: number,
    adProviderId?: string
  ): Promise<void> {
    try {
      const impression = this.adImpressionRepository.create({
        user,
        placement,
        adConfig,
        revenue,
        adProviderId,
        isClick: false
      });

      await this.adImpressionRepository.save(impression);
      await this.updateUserAdCounters(user);
    } catch (error) {
      this.logger.error(`Error recording impression for user ${user.id}:`, error);
    }
  }

  async recordClick(
    user: User,
    placement: AdPlacement,
    adConfig: AdConfig,
    revenue: number,
    adProviderId: string
  ): Promise<void> {
    try {
      const impression = this.adImpressionRepository.create({
        user,
        placement,
        adConfig,
        revenue,
        adProviderId,
        isClick: true
      });

      await this.adImpressionRepository.save(impression);
      await this.updateUserAdCounters(user);
    } catch (error) {
      this.logger.error(`Error recording click for user ${user.id}:`, error);
    }
  }

  private async shouldShowAds(user: User): Promise<boolean> {
    // Usuarios premium no ven anuncios
    if (user.isPremium()) {
      return false;
    }

    const preferences = await this.userAdPreferencesRepository.findOne({
      where: { user: { id: user.id } }
    });

    if (!preferences?.showAds) {
      return false;
    }

    // Verificar límites diarios
    const today = new Date().toDateString();
    const lastViewDate = preferences.lastAdViewDate?.toDateString();
    
    // Reset counter si es un nuevo día
    if (lastViewDate !== today) {
      preferences.adsViewedToday = 0;
      preferences.lastAdViewDate = new Date();
      await this.userAdPreferencesRepository.save(preferences);
    }

    return preferences.adsViewedToday < 20; // Límite diario de 20 anuncios
  }

  private async checkAdFrequency(user: User, placement: AdPlacement, frequency: number): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentImpressions = await this.adImpressionRepository.count({
      where: {
        user: { id: user.id },
        placement,
        createdAt: oneHourAgo,
      }
    });

    return recentImpressions < frequency;
  }

  private async updateUserAdCounters(user: User): Promise<void> {
    try {
      const preferences = await this.userAdPreferencesRepository.findOne({
        where: { user: { id: user.id } }
      });

      if (preferences) {
        preferences.adsViewedToday += 1;
        preferences.adsViewedThisMonth += 1;
        preferences.lastAdViewDate = new Date();
        
        await this.userAdPreferencesRepository.save(preferences);
      }
    } catch (error) {
      this.logger.error(`Error updating ad counters for user ${user.id}:`, error);
    }
  }

  async getAdStats(userId: string): Promise<{ today: number; month: number; totalRevenue: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayImpressions, monthImpressions, revenueResult] = await Promise.all([
      this.adImpressionRepository.count({
        where: {
          user: { id: userId },
          createdAt: today,
        }
      }),
      this.adImpressionRepository.count({
        where: {
          user: { id: userId },
          createdAt: monthStart,
        }
      }),
      this.adImpressionRepository
        .createQueryBuilder('impression')
        .select('SUM(impression.revenue)', 'totalRevenue')
        .where('impression.userId = :userId', { userId })
        .andWhere('impression.revenue IS NOT NULL')
        .getRawOne()
    ]);

    return {
      today: todayImpressions,
      month: monthImpressions,
      totalRevenue: parseFloat(revenueResult?.totalRevenue || '0')
    };
  }
}