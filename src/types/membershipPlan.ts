export interface MembershipPlanGroup {
  _id: string;
  orgId: string;
  tenantId: string;
  groupName: string;
  groupDescription: string;
  trialPeriod: boolean;
  trialDays: number;
  trialMessage: string;
  billingFrequency: string[];
  isPublished: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  displayOrder?: number;
}

export interface PlanFeature {
  _id?: string;
  feature: string;
  description: string;
}

export interface PlanProduct {
  _id?: string;
  productType?: string;
  productCategory: string;
  productCategoryId?: string;
}

export interface Plan {
  _id: string;
  orgId: string;
  tenantId: string;
  planName: string;
  description: string;
  planType?: string;
  features: PlanFeature[];
  bonusFeatures: PlanFeature[];
  products: PlanProduct[];
  isPublished: boolean;
  isDeleted: boolean;
  updatedAt: string;
  billingFrequency?: string[];
  outcomePromise?: string;
  isRecommended?: boolean;
  displayOrder?: number;
  categoryIds?: string[];
  // Add other fields as needed based on API response
}

export interface Pricing {
  _id: string;
  productId: string;
  planGroupId: string;
  planName: string;
  productType: string;
  paymentType: string;
  wasAmount: number;
  oneTimePayment: number;
  subscriptionAmount: number;
  subscriptionBillingEndsAfter: string;
  offerApplicableOnSubscriptionAmount: boolean;
  discountPercent: number;
  isIntroMembership: boolean;
  isTaxable: boolean;
  currency: string;
  orgId: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  billingCycle?: {
    frequency: number;
    unit: string;
  };
  membershipEndDate?: {
    expiryPeriod: number;
    expiryPeriodType: string;
    membershipEndsWithSubscription: boolean;
  };
}

export interface Member {
  _id: string;
  orgId: string;
  tenantId: string;
  contactId: string;
  contactEmail: string;
  firstName: string;
  lastName: string;
  planId: Plan;
  pricingId: Pricing;
  planGroupId: string;
  membershipId: string;
  status: string;
  purchaseDate: string;
  expiryDate: string;
  usageStats?: {
    coursesAccessed: number;
    assessmentsCompleted: number;
    resourcesDownloaded: number;
  };
  metadata?: {
    source: string;
    [key: string]: any;
  };
  invoices?: string[];
  isExtendExpiryDate?: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
