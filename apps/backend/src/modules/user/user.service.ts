import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserAdPreferences } from '../ads/entities/user-ad-preferences.entity';
import { AdService } from '../ads/ad.service';
import { AdPlacement } from '../ads/entities/ad-config.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserAdPreferences)
    private userAdPreferencesRepository: Repository<UserAdPreferences>,
    private adService: AdService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['adPreferences', 'subscriptions'],
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['adPreferences', 'subscriptions'],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);
    
    // Crear preferencias de anuncios por defecto
    const adPreferences = this.userAdPreferencesRepository.create({
      user: savedUser,
    });
    await this.userAdPreferencesRepository.save(adPreferences);
    
    return this.findById(savedUser.id);
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    return this.findById(id);
  }

  async getUserAdStatus(userId: string): Promise<{
    shouldShowAds: boolean;
    adsViewedToday: number;
    adsViewedMonth: number;
    isPremium: boolean;
  }> {
    const user = await this.findById(userId);
    const stats = await this.adService.getAdStats(userId);
    
    return {
      shouldShowAds: user.shouldShowAds(),
      adsViewedToday: stats.today,
      adsViewedMonth: stats.month,
      isPremium: user.isPremium(),
    };
  }

  async getAdForUserProfile(userId: string): Promise<any> {
    const user = await this.findById(userId);
    return this.adService.getAdForUser(user, AdPlacement.PROFILE_VIEW);
  }
}