import { apiService } from './api';

export interface PlanFeature {
  feature: string;
  description?: string;
  _id?: string;
}

export interface PlanPricing {
  _id: string;
  productId: string;
  planName: string;
  productType: string;
  paymentType: string;
  wasAmount?: number;
  oneTimePayment?: number;
  subscriptionAmount?: number;
  billingCycle?: {
    frequency: number;
    unit: string;
  };
  subscriptionBillingEndsAfter?: string;
  membershipEndDate?: {
    expiryPeriod: number;
    expiryPeriodType: string;
    membershipEndsWithSubscription: boolean;
  };
  offerApplicableOnSubscriptionAmount: boolean;
  discountPercent?: number;
  isIntroMembership: boolean;
  isTaxable: boolean;
  currency: string;
  isActive: boolean;
  orgId?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: any;
}

export interface PlanProduct {
  _id: string;
  productType: string;
  productCategory: string;
  productCategoryId: string;
}

export interface Plan {
  _id: string;
  orgId?: string;
  tenantId?: string;
  planName: string;
  description: string;
  features: PlanFeature[];
  bonusFeatures?: PlanFeature[];
  pricing: PlanPricing[];
  displayOrder?: number;
  isRecommended?: boolean;
  recommendedBadgeText?: string;
  planGroupId?: string;
  billingFrequency?: string;
  isPublished?: boolean;
  isDeleted?: boolean;
  products?: PlanProduct[];
  outcomePromise?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: any;
}

export interface PlanGroup {
  _id: string;
  orgId?: string;
  tenantId?: string;
  groupName: string;
  groupDescription: string;
  trialPeriod: boolean;
  trialDays?: number;
  trialMessage?: string;
  billingFrequency: string[];
  plans: Plan[];
  displayOrder?: number;
  isPublished?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: any;
}

export interface PublicPlansResponse {
  planGroups: PlanGroup[];
  [key: string]: any;
}

class PublicMembershipService {
  /**
   * Get public plans for a tenant
   * @param tenantId - The tenant ID
   */
  async getPublicPlans(tenantId: string): Promise<PublicPlansResponse> {
    // The API returns the data directly, not wrapped in an ApiResponse 'data' property
    return apiService.get<any>(`/splan/planGroup/public/plans`, {
      params: {
        includePlans: 'true',
        tid: tenantId
      }
    }) as unknown as Promise<PublicPlansResponse>;
  }

  /**
   * Get public pricing details by ID
   * @param pricingId - The pricing ID
   * @param tenantId - The tenant ID
   */
  async getPublicPricing(pricingId: string, tenantId: string): Promise<PlanPricing> {
    return apiService.get<any>(`/splan/pricing/public/${pricingId}`, {
      params: {
        tid: tenantId
      }
    }).then((res: any) => {
      // API may return { pricings: PlanPricing, planNamesList: [] }
      if (res.pricings) return res.pricings;
      // Or standard { data: PlanPricing }
      if (res.data) return res.data;
      return res;
    });
  }

  /**
   * Get current user's plan to check for existing subscriptions
   */
  async getUserPlan(): Promise<any> {
    return apiService.get<any>('/splan/userplan/contact').then(res => res.data);
  }
}

export const publicMembershipService = new PublicMembershipService();
