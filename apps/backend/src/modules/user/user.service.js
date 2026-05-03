"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const user_ad_preferences_entity_1 = require("../ads/entities/user-ad-preferences.entity");
const ad_service_1 = require("../ads/ad.service");
const ad_config_entity_1 = require("../ads/entities/ad-config.entity");
let UserService = class UserService {
    constructor(userRepository, userAdPreferencesRepository, adService) {
        this.userRepository = userRepository;
        this.userAdPreferencesRepository = userAdPreferencesRepository;
        this.adService = adService;
    }
    async findById(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['adPreferences', 'subscriptions'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmail(email) {
        return this.userRepository.findOne({
            where: { email },
            relations: ['adPreferences', 'subscriptions'],
        });
    }
    async create(userData) {
        const user = this.userRepository.create(userData);
        const savedUser = await this.userRepository.save(user);
        // Crear preferencias de anuncios por defecto
        const adPreferences = this.userAdPreferencesRepository.create({
            user: savedUser,
        });
        await this.userAdPreferencesRepository.save(adPreferences);
        return this.findById(savedUser.id);
    }
    async update(id, updateData) {
        await this.userRepository.update(id, updateData);
        return this.findById(id);
    }
    async getUserAdStatus(userId) {
        const user = await this.findById(userId);
        const stats = await this.adService.getAdStats(userId);
        return {
            shouldShowAds: user.shouldShowAds(),
            adsViewedToday: stats.today,
            adsViewedMonth: stats.month,
            isPremium: user.isPremium(),
        };
    }
    async getAdForUserProfile(userId) {
        const user = await this.findById(userId);
        return this.adService.getAdForUser(user, ad_config_entity_1.AdPlacement.PROFILE_VIEW);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_ad_preferences_entity_1.UserAdPreferences)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository, typeof (_a = typeof ad_service_1.AdService !== "undefined" && ad_service_1.AdService) === "function" ? _a : Object])
], UserService);
