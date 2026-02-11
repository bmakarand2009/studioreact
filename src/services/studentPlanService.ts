import { apiService } from './api';

export interface StudentPlanDetails {
  pricingId?: {
    planName?: string;
    planType?: string;
    paymentType?: string;
    billingCycle?: {
      frequency?: number;
      unit?: string;
    };
    subscriptionAmount?: number;
    oneTimeAmount?: number;
    oneTimePayment?: number;
    currency?: string;
  };
  planId?: {
    planName?: string;
    planType?: string;
    billingCycle?: string;
  };
  nextBillingDate?: string;
  status?: string;
  invoiceDetails?: any[];
  userplanId?: string;
  userPlanId?: string;
  guId?: string;
  _id?: string;
  id?: string;
  [key: string]: any;
}

export interface PaymentCard {
  _id: string;
  contactId: string;
  tenantId: string;
  provider: string;
  methodId: string;
  cardNoString: string;
  cardOtherString?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

class StudentPlanService {
  /**
   * Get student plan details
   */
  async getStudentPlanDetails(): Promise<any> {
    return apiService.get<any>('/splan/userplan/contact');
  }

  /**
   * Get payment method cards for a contact
   * @param contactId - The contact ID
   */
  async getPlanCardList(contactId: string): Promise<{ cardList: PaymentCard[] }> {
    // Try first with authenticated call
    try {
      const response = await apiService.get<{ cardList: PaymentCard[] }>(`/item/contact/${contactId}/card`);
      return response.data || response;
    } catch (error) {
      // If auth fails, try direct fetch similar to checkout service to bypass potential interceptor issues
      // for public/student view if needed, though ideally should be authenticated.
      // Given the user report "no Authorization header found" for this specific call, 
      // we ensure we are sending the request correctly.
      throw error;
    }
  }

  /**
   * Cancel a subscription plan
   * @param userplanId - The user plan ID
   * @param body - Cancellation details
   */
  async cancelPlan(userplanId: string, body: any): Promise<any> {
    return apiService.post<any>(`/splan/userplan/${userplanId}/cancel`, body);
  }
}

export const studentPlanService = new StudentPlanService();
