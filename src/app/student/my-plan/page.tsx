import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { studentPlanService, StudentPlanDetails, PaymentCard } from '@/services/studentPlanService';
import { Card, CardContent, Button, ConfirmationDialog } from '@/components/ui';
import { Calendar, CreditCard, Download, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { MembershipPlansList } from '@/components/membership/MembershipPlansList';
import { StudentMembershipCheckout } from '@/components/checkout';
import { PlanPricing } from '@/services/publicMembershipService';

export default function StudentMyPlanPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [paymentCard, setPaymentCard] = useState<PaymentCard | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [hasPlan, setHasPlan] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    // Logic to get contactId similar to Angular app
    const contactId = user?.guId || user?.id || user?.contactId;
    
    if (!contactId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch Plan Details
      const planResponse = await studentPlanService.getStudentPlanDetails();
      
      // Process Plan Data
      const raw = planResponse?.data;
      const entry = Array.isArray(raw)
        ? (raw.find((r: any) => (r?.contactId === contactId)) || raw[0] || {})
        : (raw || {});

      const hasPlanEntry = !!(entry?.pricingId || entry?.planId);
      setHasPlan(hasPlanEntry);

      if (hasPlanEntry) {
        // Process Plan Info
        const pricing = entry?.pricingId || {};
        const plan = entry?.planId || {};
        
        const planName = pricing?.planName || plan?.planName || plan?.planType || '';
        
        // Billing Cycle
        let billingCycle = '';
        if (pricing?.paymentType === 'recurring' && pricing?.billingCycle) {
          const freq = Number(pricing.billingCycle.frequency ?? 1);
          const unit = String(pricing.billingCycle.unit ?? '').toLowerCase();
          billingCycle = formatBillingCycle(freq, unit);
        } else if (pricing?.paymentType === 'oneTime') {
          billingCycle = 'One-time';
        } else {
          billingCycle = plan?.billingCycle || '';
        }

        // Amount & Currency
        const nextPaymentAmount = pricing?.subscriptionAmount ?? 
                                 pricing?.oneTimeAmount ?? 
                                 pricing?.oneTimePayment ?? 
                                 null;
        const currency = pricing?.currency || 'USD';
        
        // Next Payment Date
        const nextBillingDateRaw = planResponse?.nextBillingDate;
        const nextPaymentDate = nextBillingDateRaw ? new Date(nextBillingDateRaw) : null;

        // Status
        const status = (entry?.status || '').toLowerCase() || 'active';

        setPlanDetails({
          name: planName,
          billingCycle,
          nextPaymentAmount,
          currency,
          nextPaymentDate,
          status,
          entry // Store full entry if needed
        });

        // Process Invoices
        const invoiceDetails: any[] = Array.isArray(entry?.invoiceDetails) ? entry.invoiceDetails : [];
        const processedInvoices = invoiceDetails.map((inv: any) => {
          const date = inv?.createdAt ? new Date(inv.createdAt) : null;
          
          const planNameFromItem = inv?.itemName || 
            (Array.isArray(inv?.items) && inv.items.length ? inv.items[0]?.itemName : '');
          
          const amount = Array.isArray(inv?.items) && inv.items.length
            ? inv.items.reduce((sum: number, item: any) => sum + Number(item?.itemTotal ?? 0), 0)
            : Number(inv?.itemTotal ?? 0);

          const currencyForRow = (inv?.currency || currency || 'USD').toString().toUpperCase();
          
          let status = inv?.status || 'completed';
          let docId: string = inv?._id || '';
          if (Array.isArray(inv?.payments) && inv.payments.length) {
            const complete = inv.payments.find((p: any) => p?.status?.toLowerCase() === 'complete');
            const fallback = inv.payments[0];
            status = (complete?.status || fallback?.status || status);
            docId = docId || complete?.invoice || fallback?.invoice || '';
          }

          return {
            id: inv?.invoiceId || inv?.id || '',
            routeId: docId,
            date,
            planName: planNameFromItem || '',
            amount,
            currency: currencyForRow,
            status
          };
        });
        setInvoices(processedInvoices);
      }

      // Fetch Card Details
      try {
        // Use the specific contact ID oVAL1ZqKdr if available for testing/fallback
        const targetContactId = contactId || 'oVAL1ZqKdr';
        const cardResponse = await studentPlanService.getPlanCardList(targetContactId);
        
        // Handle both response structures (wrapped in data or direct)
        const cardList = (cardResponse as any)?.cardList || 
                        (cardResponse as any)?.data?.cardList || 
                        (Array.isArray(cardResponse) ? cardResponse : []);

        if (cardList && cardList.length > 0) {
          setPaymentCard(cardList[0]);
        }
      } catch (cardError) {
        console.error("Failed to fetch card details", cardError);
      }

    } catch (error) {
      console.error("Failed to fetch plan details", error);
      toast.error("Failed to load plan details");
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatBillingCycle = (freq: number, unit: string) => {
    if (freq === 1) {
      return unit === 'months' ? 'Monthly billing cycle' : 
             unit === 'years' ? 'Annual billing cycle' : 
             `Billing every ${unit}`;
    }
    return `Billing every ${freq} ${unit}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'past_due': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const parseCardDetails = (cardString: string) => {
    try {
      // Expected format: brand***************last4**exp**expiry
      // Example: visa***************4242**exp**4/2026
      const [mainPart, expiry] = cardString.split('**exp**');
      if (!mainPart || !expiry) return null;

      const brandMatch = mainPart.match(/^([a-zA-Z]+)/);
      const last4Match = mainPart.match(/(\d{4})$/);

      if (brandMatch && last4Match) {
        return {
          brand: brandMatch[1].charAt(0).toUpperCase() + brandMatch[1].slice(1),
          last4: last4Match[1],
          expiry
        };
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const handleCheckoutSuccess = useCallback(() => {
    setIsCheckingOut(false);
    setIsChangingPlan(false);
    setSelectedPlanId(null);
    toast.success("Plan updated successfully");
    fetchData();
  }, [fetchData, toast]);

  const handleCancelPlan = () => {
    setIsCancelDialogOpen(true);
  };

  const confirmCancelPlan = async () => {
    const planId = planDetails?.entry?._id || planDetails?.entry?.id;
    if (!planId) {
      toast.error("Could not find plan identifier");
      setIsCancelDialogOpen(false);
      return;
    }
    
    try {
      setIsLoading(true);
      // The API expects a body, even if empty or with reason
      await studentPlanService.cancelPlan(planId, {
        userplanId: planId,
        cancelDate: new Date().toISOString(),
        cancelReason: 'User requested cancellation' 
      });
      toast.success('Subscription cancelled successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to cancel plan', error);
      toast.error('Failed to cancel subscription');
      setIsLoading(false);
    } finally {
      setIsCancelDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">Loading plan details...</p>
      </div>
    );
  }

  if (isChangingPlan) {
    if (isCheckingOut && selectedPlanId) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
           <StudentMembershipCheckout
             itemId={selectedPlanId}
             isChangePlan={true}
             onCancel={() => {
               setIsCheckingOut(false);
               setSelectedPlanId(null);
             }}
             onSuccess={handleCheckoutSuccess}
           />
        </div>
      );
    }

    const currentPricingId = planDetails?.entry?.pricingId?._id;
    const disabledPlanIds = new Set<string>();
    if (currentPricingId) {
      disabledPlanIds.add(currentPricingId);
    }

    const handlePlanSelect = (pricing: PlanPricing) => {
      setSelectedPlanId(pricing._id);
      setIsCheckingOut(true);
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
           <div className="mb-6">
             <Button 
               variant="ghost" 
               className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
               onClick={() => setIsChangingPlan(false)}
             >
               <ArrowLeft className="h-4 w-4" />
               Back to My Plan
             </Button>
           </div>
           
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
             Change Subscription Plan
           </h1>

           <MembershipPlansList 
             disabledPlanIds={disabledPlanIds}
             onPlanSelect={handlePlanSelect}
           />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <ConfirmationDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        title="Cancel Subscription"
        description="Are you sure you want to cancel your subscription? This action cannot be undone and you will lose access to premium features."
        confirmText="Yes, Cancel"
        cancelText="Keep Subscription"
        variant="danger"
        onConfirm={confirmCancelPlan}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Plan & Billing
          </h1>
        </div>

        {!hasPlan ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Active Plan</h3>
            <p className="text-gray-500 mt-2">You don't have any active membership plans at the moment.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Subscription Summary Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {planDetails?.name}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400">
                        {planDetails?.billingCycle}
                      </p>
                    </div>
                    {planDetails?.status && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusColor(planDetails.status)}`}>
                        {planDetails.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-6">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Next payment: <span className="font-semibold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: planDetails?.currency }).format(planDetails?.nextPaymentAmount || 0)}
                      </span>
                      {' '}on{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {planDetails?.nextPaymentDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-primary-500 hover:bg-primary-500 text-white"
                      disabled={planDetails?.status === 'cancelled'}
                      onClick={() => setIsChangingPlan(true)}
                    >
                      Change plan
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      disabled={planDetails?.status === 'cancelled'}
                      onClick={handleCancelPlan}
                    >
                      Cancel subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Card */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    Payment method
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Manage your payment information
                  </p>

                  {paymentCard ? (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                          CARD
                        </div>
                        <div>
                          {(() => {
                            const details = parseCardDetails(paymentCard.cardNoString);
                            if (details) {
                              return (
                                <>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white font-mono break-all">
                                    {paymentCard.cardNoString}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Expires {details.expiry}
                                  </p>
                                </>
                              );
                            }
                            return (
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {paymentCard.cardNoString.replace(/\*/g, '•')}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 border border-dashed border-gray-300 dark:border-gray-600 text-center text-gray-500 text-sm">
                      No payment method saved
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Billing History */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  Billing History
                </h3>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Invoice ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {invoices.length > 0 ? (
                        invoices.map((invoice, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-500">
                              #{invoice.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {invoice.date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {invoice.planName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                invoice.status.toLowerCase() === 'complete' || invoice.status.toLowerCase() === 'paid'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {invoice.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                            No billing history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {invoices.length > 0 && (
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
                    Showing 1-{invoices.length} of {invoices.length} invoices
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
