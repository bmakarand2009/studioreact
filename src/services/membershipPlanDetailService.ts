import { apiService } from './api';
import { MembershipPlanGroup, Plan, Pricing, Member } from '@/types/membershipPlan';

export type { MembershipPlanGroup, Plan, Pricing, Member };

class MembershipPlanDetailService {
  
  /**
   * Get membership plan group details by ID
   * @param id - Group unique identifier
   */
  async getPlanGroupDetail(id: string): Promise<MembershipPlanGroup> {
    const response = await apiService.get<any>(`/splan/planGroup/${id}`);
    return (response as any).planGroup || response;
  }

  /**
   * Get plans within a specific group
   * @param groupId - The ID of the plan group
   * @param params - Pagination parameters
   */
  async getPlansByGroupId(
    groupId: string, 
    params: { page?: number; limit?: number } = { page: 1, limit: 150 }
  ): Promise<any> {
    const queryParams = new URLSearchParams({
      groupId,
      page: params.page?.toString() || '1',
      limit: params.limit?.toString() || '150'
    });
    
    // The API returns { billingFrequencys: string[], studioplans: Plan[] } directly
    const response = await apiService.get<any>(`/splan/splan?${queryParams.toString()}`);
    return response;
  }

  /**
   * Get pricing tiers for a plan group
   * @param groupId - Plan Group ID
   */
  async getPricingsByGroupId(groupId: string): Promise<Pricing[]> {
    const response = await apiService.get<any>(`/splan/pricing?planGroupId=${groupId}`);
    return (response as any).pricings || [];
  }

  /**
   * Get members associated with a plan group
   * @param groupId - Plan Group ID
   */
  async getMembersByGroupId(groupId: string): Promise<Member[]> {
    const response = await apiService.get<any>(`/splan/userplan?planGroupId=${groupId}`);
    return (response as any).data || [];
  }

  /**
   * Toggle publish status of a plan group
   * @param id - Group ID
   * @param isPublished - New publish status
   */
  async togglePublishStatus(id: string, isPublished: boolean): Promise<void> {
    await apiService.put(`/splan/planGroup/${id}`, { isPublished });
  }

  /**
   * Toggle publish status of a plan
   * @param id - Plan ID
   * @param isPublished - New publish status
   */
  async togglePlanStatus(id: string, isPublished: boolean): Promise<void> {
    await apiService.put(`/splan/splan/${id}`, { isPublished });
  }

  /**
   * Toggle active status of a pricing
   * @param id - Pricing ID
   * @param isActive - New active status
   */
  async togglePricingStatus(id: string, isActive: boolean): Promise<void> {
    await apiService.put(`/splan/pricing/${id}`, { isActive });
  }

  /**
   * Get plan details by ID
   * @param planId - The ID of the plan
   */
  async getPlanById(planId: string): Promise<Plan> {
    const response = await apiService.get<any>(`/splan/splan/${planId}`);
    return (response as any).studioplan || response;
  }

  /**
   * Create a new plan
   * @param groupId - The ID of the plan group
   * @param planData - The plan data
   */
  async createPlan(groupId: string, planData: Partial<Plan>): Promise<Plan> {
    const response = await apiService.post<any>(`/splan/splan`, { ...planData, planGroupId: groupId });
    return response as unknown as Plan;
  }

  /**
   * Update an existing plan
   * @param planId - The ID of the plan
   * @param planData - The plan data to update
   */
  async updatePlan(planId: string, planData: Partial<Plan>): Promise<Plan> {
    const response = await apiService.put<any>(`/splan/splan/${planId}`, planData);
    return response as unknown as Plan;
  }

  /**
   * Delete a plan
   * @param planId - The ID of the plan
   */
  async deletePlan(planId: string): Promise<void> {
    await apiService.delete(`/splan/splan/${planId}`);
  }

  /**
   * Create a new pricing
   * @param groupId - The ID of the plan group
   * @param pricingData - The pricing data
   */
  async createPricing(groupId: string, pricingData: Partial<Pricing>): Promise<Pricing> {
    const response = await apiService.post<any>(`/splan/pricing`, { ...pricingData, planGroupId: groupId });
    return response as unknown as Pricing;
  }

  /**
   * Update an existing pricing
   * @param pricingId - The ID of the pricing
   * @param pricingData - The pricing data to update
   */
  async updatePricing(pricingId: string, pricingData: Partial<Pricing>): Promise<Pricing> {
    const response = await apiService.put<any>(`/splan/pricing/${pricingId}`, pricingData);
    return response as unknown as Pricing;
  }

  /**
   * Delete a pricing
   * @param pricingId - The ID of the pricing
   */
  async deletePricing(pricingId: string): Promise<void> {
    await apiService.delete(`/splan/pricing/${pricingId}`);
  }

  /**
   * Update plan display order
   * @param planId - The ID of the plan
   * @param displayOrder - The new display order
   */
  async updatePlanDisplayOrder(planId: string, displayOrder: number): Promise<void> {
    await apiService.put(`/splan/splan/${planId}`, { displayOrder });
  }
}

export const membershipPlanDetailService = new MembershipPlanDetailService();
