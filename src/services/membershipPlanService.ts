import { apiService } from './api';
import { MembershipPlanGroup } from '@/types/membershipPlan';

// Re-export types for backward compatibility if needed, 
// but preferably use @/types/membershipPlan
export type { MembershipPlanGroup };

class MembershipPlanService {
  /**
   * Fetch membership plan groups with filtering
   * @param params - Filter options
   */
  async getPlanGroups(params?: {
    search?: string;
    isShowArchived?: boolean;
  }): Promise<MembershipPlanGroup[]> {
    const response = await apiService.get<MembershipPlanGroup[]>('/splan/planGroup');
    const raw: any = response;
    let plans: MembershipPlanGroup[] =
      Array.isArray(raw?.planGroups)
        ? raw.planGroups
        : Array.isArray(raw?.data?.planGroups)
          ? raw.data.planGroups
          : Array.isArray(raw)
            ? raw
            : (raw?.data ?? []);

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      plans = plans.filter(p => 
        p.groupName?.toLowerCase().includes(searchLower) || 
        p.groupDescription?.toLowerCase().includes(searchLower)
      );
    }
    
    if (!params?.isShowArchived) {
       plans = plans.filter(p => !p.isDeleted);
    }

    return plans;
  }

  /**
   * Get membership plan group details by ID
   * @param id - Group unique identifier
   */
  async getPlanGroupById(id: string): Promise<MembershipPlanGroup> {
    const response = await apiService.get<any>(`/splan/planGroup/${id}`);
    const responseData = response as any;
    return responseData.planGroup || response;
  }

  /**
   * Toggle publish status of a plan group
   * @param id - Group ID
   * @param isPublished - New publish status
   */
  async togglePublishStatus(id: string, isPublished: boolean): Promise<void> {
    await apiService.patch(`/splan/planGroup/${id}`, { isPublished });
  }

  /**
   * Create a new membership plan group
   * @param data - Plan group data
   */
  async createPlanGroup(data: {
    groupName: string;
    groupDescription: string;
    trialPeriod: boolean;
    trialDays: number;
    trialMessage: string;
    billingFrequency: string[];
  }): Promise<MembershipPlanGroup> {
    const response = await apiService.post<any>('/splan/planGroup', data);
    const responseData = response as any;
    return responseData.planGroup || response;
  }

  /**
   * Update an existing membership plan group
   * @param id - Group ID
   * @param data - Plan group data to update
   */
  async updatePlanGroup(id: string, data: Partial<{
    groupName: string;
    groupDescription: string;
    trialPeriod: boolean;
    trialDays: number;
    trialMessage: string;
    billingFrequency: string[];
  }>): Promise<MembershipPlanGroup> {
    const response = await apiService.put<any>(`/splan/planGroup/${id}`, data);
    const responseData = response as any;
    return responseData.planGroup || response;
  }

  /**
   * Delete a membership plan group
   * @param id - Group ID
   */
  async deletePlanGroup(id: string): Promise<void> {
    await apiService.delete(`/splan/planGroup/${id}`);
  }
}

export const membershipPlanService = new MembershipPlanService();
