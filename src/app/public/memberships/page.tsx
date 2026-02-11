import React, { useState, useEffect } from 'react';
import { publicMembershipService, PlanPricing } from '@/services/publicMembershipService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MembershipPlansList } from '@/components/membership/MembershipPlansList';

export default function PublicMembershipsPage() {
  const [currentPlanIds, setCurrentPlanIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const changePlanId = searchParams.get('changePlan');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkUserPlan();
    }
  }, [user]);

  const checkUserPlan = async () => {
    try {
      const userPlan = await publicMembershipService.getUserPlan();
      // Logic to identify purchased plans - this is a simplified assumption
      // Real logic depends on how userPlan structure maps to pricing IDs
      // Assuming we might find a pricingId or planId in the response
      const ids = new Set<string>();
      if (userPlan) {
        // Add logic here if we know the structure of userPlan response
        // For now, we'll just leave it empty or log it
        // console.log('User plan:', userPlan);
      }
      setCurrentPlanIds(ids);
    } catch (error) {
      // User might not be logged in or other error, safe to ignore for public view
      console.warn('Could not check user plan:', error);
    }
  };

  const handleChoosePlan = (pricing: PlanPricing) => {
    // Navigate to checkout
    console.log('Selected plan for checkout:', pricing.planName, pricing._id);
    let url = `/checkout/membership/${pricing._id}?productType=plan`;
    if (changePlanId) {
       url += `&isChangePlan=true`;
    }
    navigate(url);
  };

  const disabledIds = new Set(currentPlanIds);
  if (changePlanId) disabledIds.add(changePlanId);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <MembershipPlansList 
        disabledPlanIds={disabledIds}
        onPlanSelect={handleChoosePlan}
      />
    </div>
  );
}
