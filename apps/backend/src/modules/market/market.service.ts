import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { OfferCard } from './entities/offer-card.entity';
import { UserService } from '../user/user.service';
import { CardsService } from '../cards/cards.service';
import { AdService } from '../ads/ad.service';
import { AdPlacement } from '../ads/entities/ad-config.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { CreateOfferCardDto } from './dto/create-offer-card.dto';
import { FilterOfferDto } from './dto/filter-offer.dto';
import { OfferStatus } from './enums/offer-status.enum';
import { OfferType } from './enums/offer-type.enum';
import { User } from '../user/entities/user.entity';
import { Card } from '../cards/entities/card.entity';

@Injectable()
export class MarketService {
  constructor(
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
    @InjectRepository(OfferCard)
    private offerCardRepository: Repository<OfferCard>,
    private userService: UserService,
    private cardsService: CardsService,
    private adService: AdService,
  ) {}

  async createOffer(userId: string, createOfferDto: CreateOfferDto): Promise<{ offer: Offer; adRequired?: any }> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Validar cartas
    const cardIds = createOfferDto.offerCards.map((oc: CreateOfferCardDto) => oc.cardId);
    const cards = await this.cardsService.findByIds(cardIds);
    
    if (cards.length !== cardIds.length) {
      throw new BadRequestException('One or more cards not found');
    }

    // Verificar si el usuario necesita ver anuncio
    let adRequired = null;
    if (user.shouldShowAds && user.shouldShowAds()) {
      adRequired = await this.adService.getAdForUser(user, AdPlacement.OFFER_CREATION);
    }

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (createOfferDto.expirationDays || 30));

    // Crear oferta
    const offer = this.offerRepository.create({
      ...createOfferDto,
      user,
      expiresAt,
      hasAd: !!adRequired,
    });

    const savedOffer = await this.offerRepository.save(offer);

    // Crear offerCards
    const offerCards = createOfferDto.offerCards.map((offerCardDto: CreateOfferCardDto) => {
      const card = cards.find((c: Card) => c.id === offerCardDto.cardId);
      return this.offerCardRepository.create({
        ...offerCardDto,
        offer: savedOffer,
        card,
      });
    });

    await this.offerCardRepository.save(offerCards);

    // Registrar anuncio si es necesario
    if (adRequired) {
      // Buscar el AdConfig correspondiente
      const adConfig = await this.adService.findAdConfigByPlacement(AdPlacement.OFFER_CREATION);
      if (adConfig) {
        await this.adService.recordImpression(
          user, 
          AdPlacement.OFFER_CREATION, 
          adConfig,
          0.01,
          'offer_creation_' + savedOffer.id
        );
      }
    }

    // Cargar relaciones para retornar
    const completeOffer = await this.offerRepository.findOne({
      where: { id: savedOffer.id },
      relations: ['user', 'offerCards', 'offerCards.card'],
    });

    if (!completeOffer) {
      throw new NotFoundException('Offer not found after creation');
    }

    return { offer: completeOffer, adRequired };
  }

  async findAllOffers(filterOfferDto: FilterOfferDto, requestingUserId?: string): Promise<{ offers: Offer[]; ads: any[] }> {
    const query = this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.user', 'user')
      .leftJoinAndSelect('offer.offerCards', 'offerCards')
      .leftJoinAndSelect('offerCards.card', 'card')
      .where('offer.status = :status', { status: OfferStatus.ACTIVE })
      .andWhere('offer.expiresAt > :now', { now: new Date() });

    // Aplicar filtros
    if (filterOfferDto.type) {
      query.andWhere('offer.type = :type', { type: filterOfferDto.type });
    }

    if (filterOfferDto.cardIds && filterOfferDto.cardIds.length > 0) {
      query.andWhere('card.id IN (:...cardIds)', { cardIds: filterOfferDto.cardIds });
    }

    if (filterOfferDto.cardId) {
      query.andWhere('card.id = :cardId', { cardId: filterOfferDto.cardId });
    }

    if (filterOfferDto.query) {
      query.andWhere('(card.name ILIKE :query OR card.cardNumber ILIKE :query OR offer.title ILIKE :query)', {
        query: `%${filterOfferDto.query}%`,
      });
    }

    if (filterOfferDto.minPrice) {
      query.andWhere('(SELECT SUM(oc.pricePerUnit * oc.quantity) FROM offer_cards oc WHERE oc.offerId = offer.id) >= :minPrice', 
        { minPrice: filterOfferDto.minPrice });
    }

    if (filterOfferDto.maxPrice) {
      query.andWhere('(SELECT SUM(oc.pricePerUnit * oc.quantity) FROM offer_cards oc WHERE oc.offerId = offer.id) <= :maxPrice', 
        { maxPrice: filterOfferDto.maxPrice });
    }

    if (filterOfferDto.language) {
      query.andWhere('offerCards.language = :language', { language: filterOfferDto.language });
    }

    if (filterOfferDto.condition) {
      query.andWhere('offerCards.condition = :condition', { condition: filterOfferDto.condition });
    }

    // Ordenar
    if (filterOfferDto.sortBy) {
      const sortOrder = filterOfferDto.sortOrder || 'DESC';
      query.orderBy(`offer.${filterOfferDto.sortBy}`, sortOrder);
    } else {
      query.orderBy('offer.createdAt', 'DESC');
    }

    // Paginar
    if (filterOfferDto.limit) {
      query.limit(filterOfferDto.limit);
    }

    if (filterOfferDto.offset) {
      query.offset(filterOfferDto.offset);
    }

    const offers = await query.getMany();

    // Obtener anuncios
    let ads: any[] = [];
    if (requestingUserId) {
      const user = await this.userService.findById(requestingUserId);
      if (user && user.shouldShowAds && user.shouldShowAds()) {
        const ad = await this.adService.getAdForUser(user, AdPlacement.OFFER_LIST);
        if (ad) {
          ads = [ad];
          const adConfig = await this.adService.findAdConfigByPlacement(AdPlacement.OFFER_LIST);
          if (adConfig) {
            await this.adService.recordImpression(user, AdPlacement.OFFER_LIST, adConfig, 0.005, 'offer_list');
          }
        }
      }
    }

    return { offers, ads };
  }

  async searchOffers(filterOfferDto: FilterOfferDto, requestingUserId?: string): Promise<{ offers: Offer[]; ads: any[] }> {
    return this.findAllOffers(filterOfferDto, requestingUserId);
  }

  async getUserOffers(userId: string): Promise<Offer[]> {
    return this.offerRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'offerCards', 'offerCards.card'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOfferById(id: string, requestingUserId?: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ['user', 'offerCards', 'offerCards.card'],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Incrementar vistas
    offer.views += 1;
    await this.offerRepository.save(offer);

    // Verificar si mostrar anuncio
    if (requestingUserId && requestingUserId !== offer.user.id) {
      const user = await this.userService.findById(requestingUserId);
      if (user && user.shouldShowAds && user.shouldShowAds()) {
        await this.adService.getAdForUser(user, AdPlacement.OFFER_DETAIL);
      }
    }

    return offer;
  }

  async updateOffer(userId: string, offerId: string, updateData: UpdateOfferDto): Promise<Offer> {
    const offer = await this.findOfferById(offerId);
    
    if (offer.user.id !== userId) {
      throw new ForbiddenException('Only the offer owner can update this offer');
    }

    if (offer.status !== OfferStatus.ACTIVE) {
      throw new BadRequestException('Only active offers can be updated');
    }

    // Actualizar campos básicos
    if (updateData.title !== undefined) offer.title = updateData.title;
    if (updateData.description !== undefined) offer.description = updateData.description;
    if (updateData.bundlePreference !== undefined) offer.bundlePreference = updateData.bundlePreference;
    if (updateData.isBundle !== undefined) offer.isBundle = updateData.isBundle;
    if (updateData.allowSeparateSale !== undefined) offer.allowSeparateSale = updateData.allowSeparateSale;
    if (updateData.status !== undefined) offer.status = updateData.status;

    // Actualizar offerCards si se proporcionan
    if (updateData.offerCards && updateData.offerCards.length > 0) {
      // Eliminar offerCards existentes
      await this.offerCardRepository.delete({ offer: { id: offerId } });

      // Validar y crear nuevas offerCards
      const cardIds = updateData.offerCards.map((oc: CreateOfferCardDto) => oc.cardId);
      const cards = await this.cardsService.findByIds(cardIds);
      
      if (cards.length !== cardIds.length) {
        throw new BadRequestException('One or more cards not found');
      }

      const offerCards = updateData.offerCards.map((offerCardDto: CreateOfferCardDto) => {
        const card = cards.find((c: Card) => c.id === offerCardDto.cardId);
        return this.offerCardRepository.create({
          ...offerCardDto,
          offer,
          card,
        });
      });

      await this.offerCardRepository.save(offerCards);
    }

    const updatedOffer = await this.offerRepository.save(offer);
    
    // Recargar relaciones
    const reloadedOffer = await this.offerRepository.findOne({
      where: { id: updatedOffer.id },
      relations: ['user', 'offerCards', 'offerCards.card'],
    });

    if (!reloadedOffer) {
      throw new NotFoundException('Offer not found after update');
    }

    return reloadedOffer;
  }

  async deleteOffer(userId: string, offerId: string): Promise<void> {
    const offer = await this.findOfferById(offerId);
    
    if (offer.user.id !== userId) {
      throw new ForbiddenException('Only the offer owner can delete this offer');
    }

    await this.offerRepository.remove(offer);
  }

  async acceptOffer(acceptorUserId: string, offerId: string): Promise<{ order: any; conversation: any }> {
    const offer = await this.findOfferById(offerId);
    const acceptor = await this.userService.findById(acceptorUserId);

    if (!acceptor) {
      throw new NotFoundException('User not found');
    }

    if (offer.user.id === acceptorUserId) {
      throw new BadRequestException('Cannot accept your own offer');
    }

    // Crear orden
    const orderData = {
      buyer: offer.type === OfferType.SELL ? acceptor : offer.user,
      seller: offer.type === OfferType.SELL ? offer.user : acceptor,
      offer,
      totalPrice: offer.getTotalPrice(),
      orderCards: offer.offerCards.map((offerCard: OfferCard) => ({
        card: offerCard.card,
        quantity: offerCard.quantity,
        pricePerUnit: offerCard.pricePerUnit,
      })),
    };

    // Marcar oferta como negociada
    await this.updateOfferStatus(offerId, OfferStatus.NEGOTIATED);

    // Crear conversación de chat
    const conversationData = {
      buyer: orderData.buyer,
      seller: orderData.seller,
      offer,
      title: `Negociación: ${offer.offerCards[0]?.card.name}${offer.offerCards.length > 1 ? ' + más' : ''}`,
    };

    return {
      order: orderData,
      conversation: conversationData,
    };
  }

  async markOfferAsSold(offerId: string, userId: string): Promise<Offer> {
    const offer = await this.findOfferById(offerId);
    
    if (offer.user.id !== userId) {
      throw new ForbiddenException('Only the offer owner can mark it as sold');
    }

    if (offer.status !== OfferStatus.NEGOTIATED) {
      throw new BadRequestException('Offer must be negotiated before marking as sold');
    }

    offer.status = OfferStatus.COMPLETED;
    return this.offerRepository.save(offer);
  }

  async expireOffers(): Promise<void> {
    const expiredOffers = await this.offerRepository
      .createQueryBuilder('offer')
      .where('offer.status = :status', { status: OfferStatus.ACTIVE })
      .andWhere('offer.expiresAt <= :now', { now: new Date() })
      .getMany();

    for (const offer of expiredOffers) {
      offer.status = OfferStatus.EXPIRED;
      await this.offerRepository.save(offer);
    }
  }

  // Métodos auxiliares
  private async updateOfferStatus(offerId: string, status: OfferStatus): Promise<void> {
    await this.offerRepository.update(offerId, { status });
  }
}